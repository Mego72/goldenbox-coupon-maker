import { useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Printer, Download, ArrowLeft } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_discount_value: number | null;
  company_name: string | null;
  description: string | null;
  expiry_date: string | null;
  is_active: boolean;
  is_consumed: boolean;
  consumed_by_customer: string | null;
  consumed_by_mobile: string | null;
  consumed_at: string | null;
  branch_name: string | null;
  created_at: string;
  batch_id: string | null;
  credit_number: string | null;
  company_due: number | null;
}

interface ConsumptionReportProps {
  coupons: Coupon[];
  onBack: () => void;
}

const ConsumptionReport = ({ coupons, onBack }: ConsumptionReportProps) => {
  const { t, lang, dir } = useLanguage();
  const reportRef = useRef<HTMLDivElement>(null);

  const consumedCoupons = coupons.filter((c) => c.is_consumed);

  const companyName = consumedCoupons[0]?.company_name || "-";

  const invoiceNumber = useMemo(() => {
    const date = new Date();
    return `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  }, []);

  const sumCompanyDue = consumedCoupons.reduce(
    (sum, c) => sum + (c.company_due ?? 0),
    0
  );

  const dateRange = useMemo(() => {
    if (consumedCoupons.length === 0) return { from: "-", to: "-" };
    const dates = consumedCoupons
      .map((c) => c.consumed_at ? new Date(c.consumed_at).getTime() : 0)
      .filter(Boolean);
    if (dates.length === 0) return { from: "-", to: "-" };
    return {
      from: new Date(Math.min(...dates)).toLocaleDateString(),
      to: new Date(Math.max(...dates)).toLocaleDateString(),
    };
  }, [consumedCoupons]);

  const handlePrint = () => {
    const printContent = reportRef.current;
    if (!printContent) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="${dir}">
        <head>
          <title>${t("proformaInvoice")}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+Arabic:wght@300;400;500;600;700&display=swap');
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', 'Noto Sans Arabic', sans-serif; padding: 32px; color: #1a1a1a; background: #fff; }
            .invoice-container { max-width: 800px; margin: 0 auto; }
            .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #b8860b; }
            .invoice-title { font-size: 28px; font-weight: 700; color: #b8860b; letter-spacing: 1px; }
            .invoice-meta { font-size: 12px; color: #555; line-height: 1.8; }
            .invoice-meta strong { color: #333; }
            .bill-to { background: #faf6ef; border: 1px solid #e8dcc8; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
            .bill-to-label { font-size: 11px; text-transform: uppercase; color: #888; letter-spacing: 1px; margin-bottom: 4px; }
            .bill-to-name { font-size: 18px; font-weight: 600; color: #333; }
            .period { font-size: 12px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px; }
            thead th { background: #b8860b; color: #fff; padding: 10px 12px; text-align: ${dir === "rtl" ? "right" : "left"}; font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
            tbody td { padding: 8px 12px; border-bottom: 1px solid #eee; color: #444; }
            tbody tr:nth-child(even) { background: #fdfaf5; }
            .totals-section { border-top: 2px solid #b8860b; padding-top: 16px; }
            .total-row { display: flex; justify-content: space-between; padding: 8px 12px; font-size: 13px; }
            .total-row.grand { background: #b8860b; color: #fff; font-size: 16px; font-weight: 700; border-radius: 6px; margin-top: 8px; padding: 12px 16px; }
            .footer-note { margin-top: 32px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #888; text-align: center; }
            @media print {
              body { padding: 0; }
              @page { margin: 12mm; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const handleExportExcel = () => {
    const wsData = consumedCoupons.map((c, i) => ({
      [t("itemNo")]: i + 1,
      [t("code")]: c.code,
      [t("consumedBy")]: c.consumed_by_customer || "-",
      [t("mobile")]: c.consumed_by_mobile || "-",
      [t("branch")]: c.branch_name || "-",
      [t("consumedAt")]: c.consumed_at ? new Date(c.consumed_at).toLocaleDateString() : "-",
      [t("companyDue")]: c.company_due ?? 0,
    }));

    wsData.push({
      [t("itemNo")]: "" as any,
      [t("code")]: "",
      [t("consumedBy")]: "",
      [t("mobile")]: "",
      [t("branch")]: "",
      [t("consumedAt")]: t("totalDue"),
      [t("companyDue")]: sumCompanyDue as any,
    });

    const ws = XLSX.utils.json_to_sheet(wsData);
    ws["!cols"] = [
      { wch: 5 }, { wch: 22 }, { wch: 20 }, { wch: 16 },
      { wch: 16 }, { wch: 14 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Proforma Invoice");
    XLSX.writeFile(wb, `Proforma_Invoice_${companyName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(t("excelDownloaded"));
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 me-1" /> {t("backToList")}
        </Button>
        <div className="flex items-center gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm" className="gold-border text-primary hover:bg-primary/10">
            <Printer className="h-4 w-4 me-1" /> {t("printReport")}
          </Button>
          <Button onClick={handleExportExcel} variant="outline" size="sm" className="gold-border text-primary hover:bg-primary/10">
            <Download className="h-4 w-4 me-1" /> {t("exportReportExcel")}
          </Button>
        </div>
      </div>

      {/* Invoice Content */}
      <div ref={reportRef} className="invoice-container rounded-xl border border-border bg-card p-8 space-y-6 max-w-[850px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-primary pb-5">
          <div>
            <h1 className="text-2xl font-bold text-primary tracking-wide">{t("proformaInvoice")}</h1>
            <p className="text-xs text-muted-foreground mt-1">{t("couponUsageCharges")}</p>
          </div>
          <div className="text-end text-xs text-muted-foreground space-y-1">
            <div><span className="font-semibold text-foreground">{t("invoiceNumber")}:</span> {invoiceNumber}</div>
            <div><span className="font-semibold text-foreground">{t("invoiceDate")}:</span> {new Date().toLocaleDateString()}</div>
            <div><span className="font-semibold text-foreground">{t("consumedCount")}:</span> {consumedCoupons.length}</div>
          </div>
        </div>

        {/* Bill To */}
        <div className="bg-secondary/50 border border-border rounded-lg p-4">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{t("billTo")}</p>
          <p className="text-lg font-semibold text-foreground">{companyName}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("periodFrom")}: {dateRange.from} — {t("periodTo")}: {dateRange.to}
          </p>
        </div>

        {consumedCoupons.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">{t("noResults")}</p>
        ) : (
          <>
            {/* Items Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary text-primary-foreground">
                    <th className="px-3 py-2.5 text-start font-semibold text-xs uppercase tracking-wider">{t("itemNo")}</th>
                    <th className="px-3 py-2.5 text-start font-semibold text-xs uppercase tracking-wider">{t("code")}</th>
                    <th className="px-3 py-2.5 text-start font-semibold text-xs uppercase tracking-wider">{t("consumedBy")}</th>
                    <th className="px-3 py-2.5 text-start font-semibold text-xs uppercase tracking-wider">{t("mobile")}</th>
                    <th className="px-3 py-2.5 text-start font-semibold text-xs uppercase tracking-wider">{t("branch")}</th>
                    <th className="px-3 py-2.5 text-start font-semibold text-xs uppercase tracking-wider">{t("consumedAt")}</th>
                    <th className="px-3 py-2.5 text-end font-semibold text-xs uppercase tracking-wider">{t("companyDue")}</th>
                  </tr>
                </thead>
                <tbody>
                  {consumedCoupons.map((c, i) => (
                    <tr key={c.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2 font-mono text-primary font-semibold text-xs">{c.code}</td>
                      <td className="px-3 py-2 text-foreground">{c.consumed_by_customer || "-"}</td>
                      <td className="px-3 py-2 text-foreground">{c.consumed_by_mobile || "-"}</td>
                      <td className="px-3 py-2 text-foreground">{c.branch_name || "-"}</td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">
                        {c.consumed_at ? new Date(c.consumed_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="px-3 py-2 text-end font-semibold text-foreground">
                        {(c.company_due ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="border-t-2 border-primary pt-4 space-y-2 max-w-xs ms-auto">
              <div className="flex justify-between text-sm text-muted-foreground px-2">
                <span>{t("subtotal")}</span>
                <span className="font-semibold text-foreground">{sumCompanyDue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between bg-primary text-primary-foreground rounded-lg px-4 py-3 text-base font-bold">
                <span>{t("totalDue")}</span>
                <span>{sumCompanyDue.toLocaleString()}</span>
              </div>
            </div>

            {/* Footer Note */}
            <div className="border-t border-border pt-4 mt-6">
              <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                {t("invoiceNote")}
              </p>
              <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
                {t("generatedBy")}: GoldenBox Coupons System
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConsumptionReport;
