import { useRef } from "react";
import { Badge } from "@/components/ui/badge";
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
}

interface ConsumptionReportProps {
  coupons: Coupon[];
  onBack: () => void;
}

const ConsumptionReport = ({ coupons, onBack }: ConsumptionReportProps) => {
  const { t, lang, dir } = useLanguage();
  const reportRef = useRef<HTMLDivElement>(null);

  const consumedCoupons = coupons.filter((c) => c.is_consumed);

  const sumMaxValue = consumedCoupons.reduce(
    (sum, c) => sum + (c.max_discount_value ?? 0),
    0
  );

  const sumDiscountValue = consumedCoupons.reduce(
    (sum, c) => sum + c.discount_value,
    0
  );

  const handlePrint = () => {
    const printContent = reportRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="${dir}">
        <head>
          <title>${t("consumptionReport")}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 20px; color: #1a1a1a; }
            h2 { text-align: center; margin-bottom: 4px; font-size: 20px; }
            .subtitle { text-align: center; color: #666; font-size: 13px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 16px; }
            th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: ${dir === "rtl" ? "right" : "left"}; }
            th { background: #f5f5f5; font-weight: 600; }
            .totals { margin-top: 12px; font-size: 14px; }
            .totals div { margin-bottom: 6px; padding: 6px 10px; background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; display: flex; justify-content: space-between; }
            .totals strong { color: #333; }
            @media print {
              body { padding: 0; }
              @page { margin: 10mm; }
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
      "#": i + 1,
      [t("code")]: c.code,
      [t("company")]: c.company_name || "-",
      [t("type")]: c.discount_type === "percentage" ? t("percentage") : t("fixedAmount"),
      [t("discountValueCol")]: c.discount_value,
      [t("maxValue")]: c.max_discount_value ?? t("noLimit"),
      [t("consumedBy")]: c.consumed_by_customer || "-",
      [t("mobile")]: c.consumed_by_mobile || "-",
      [t("branch")]: c.branch_name || "-",
      [t("consumedAt")]: c.consumed_at ? new Date(c.consumed_at).toLocaleDateString() : "-",
    }));

    // Add totals row
    wsData.push({
      "#": "",
      [t("code")]: "",
      [t("company")]: "",
      [t("type")]: "",
      [t("discountValueCol")]: sumDiscountValue as any,
      [t("maxValue")]: sumMaxValue as any,
      [t("consumedBy")]: "",
      [t("mobile")]: "",
      [t("branch")]: t("consumedCount") + ": " + consumedCoupons.length,
      [t("consumedAt")]: "",
    } as any);

    const ws = XLSX.utils.json_to_sheet(wsData);
    ws["!cols"] = [
      { wch: 5 }, { wch: 22 }, { wch: 20 }, { wch: 14 },
      { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 16 },
      { wch: 16 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Consumption Report");
    XLSX.writeFile(wb, `Consumption_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
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

      {/* Report Content */}
      <div ref={reportRef} className="rounded-xl border border-border bg-card p-6 space-y-4">
        <h2 className="text-xl font-bold text-center text-foreground">{t("consumptionReport")}</h2>
        <p className="text-center text-sm text-muted-foreground">
          {t("reportDate")}: {new Date().toLocaleDateString()} — {t("consumedCount")}: {consumedCoupons.length}
        </p>

        {consumedCoupons.length === 0 ? (
          <p className="text-center py-10 text-muted-foreground">{t("noResults")}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary">
                    <th className="px-3 py-2 text-start text-muted-foreground font-semibold">#</th>
                    <th className="px-3 py-2 text-start text-muted-foreground font-semibold">{t("code")}</th>
                    <th className="px-3 py-2 text-start text-muted-foreground font-semibold">{t("company")}</th>
                    <th className="px-3 py-2 text-start text-muted-foreground font-semibold">{t("type")}</th>
                    <th className="px-3 py-2 text-start text-muted-foreground font-semibold">{t("discountValueCol")}</th>
                    <th className="px-3 py-2 text-start text-muted-foreground font-semibold">{t("maxValue")}</th>
                    <th className="px-3 py-2 text-start text-muted-foreground font-semibold">{t("consumedBy")}</th>
                    <th className="px-3 py-2 text-start text-muted-foreground font-semibold">{t("mobile")}</th>
                    <th className="px-3 py-2 text-start text-muted-foreground font-semibold">{t("branch")}</th>
                    <th className="px-3 py-2 text-start text-muted-foreground font-semibold">{t("consumedAt")}</th>
                  </tr>
                </thead>
                <tbody>
                  {consumedCoupons.map((c, i) => (
                    <tr key={c.id} className="border-t border-border bg-background hover:bg-secondary/50">
                      <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                      <td className="px-3 py-2 font-mono text-primary font-semibold">{c.code}</td>
                      <td className="px-3 py-2 text-foreground">{c.company_name || "-"}</td>
                      <td className="px-3 py-2 text-foreground">
                        {c.discount_type === "percentage" ? "%" : t("fixedAmount")}
                      </td>
                      <td className="px-3 py-2 text-foreground">
                        {c.discount_value}{c.discount_type === "percentage" ? "%" : ""}
                      </td>
                      <td className="px-3 py-2 text-foreground">{c.max_discount_value ?? t("noLimit")}</td>
                      <td className="px-3 py-2 text-foreground">{c.consumed_by_customer || "-"}</td>
                      <td className="px-3 py-2 text-foreground">{c.consumed_by_mobile || "-"}</td>
                      <td className="px-3 py-2 text-foreground">{c.branch_name || "-"}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {c.consumed_at ? new Date(c.consumed_at).toLocaleDateString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* Totals Row */}
                <tfoot>
                  <tr className="border-t-2 border-primary bg-secondary font-bold">
                    <td colSpan={4} className="px-3 py-3 text-foreground text-end">{t("sumDiscountValue")} / {t("sumMaxValue")}</td>
                    <td className="px-3 py-3 text-primary">{sumDiscountValue}</td>
                    <td className="px-3 py-3 text-primary">{sumMaxValue}</td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ConsumptionReport;
