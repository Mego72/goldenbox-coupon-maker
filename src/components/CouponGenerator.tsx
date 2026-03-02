import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import * as XLSX from "xlsx";
import { useLanguage } from "@/i18n/LanguageContext";

interface GeneratedCoupon {
  code: string;
  discount_type: string;
  discount_value: number;
  max_discount_value: number | null;
  company_name: string;
  description: string;
  expiry_date: string;
}

const generateCode = (prefix: string, length: number): string => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = prefix ? prefix + "-" : "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const CouponGenerator = () => {
  const { t } = useLanguage();
  const [prefix, setPrefix] = useState("GB");
  const [codeLength, setCodeLength] = useState(8);
  const [quantity, setQuantity] = useState(10);
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState(10);
  const [maxDiscountValue, setMaxDiscountValue] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isUnlimited, setIsUnlimited] = useState(false);
  const [generatedCoupons, setGeneratedCoupons] = useState<GeneratedCoupon[]>([]);
  const [saving, setSaving] = useState(false);

  const handleGenerate = () => {
    const coupons: GeneratedCoupon[] = [];
    const usedCodes = new Set<string>();
    for (let i = 0; i < quantity; i++) {
      let code: string;
      do {
        code = generateCode(prefix, codeLength);
      } while (usedCodes.has(code));
      usedCodes.add(code);
      coupons.push({
        code,
        discount_type: discountType,
        discount_value: discountValue,
        max_discount_value: discountType === "percentage" ? maxDiscountValue : null,
        company_name: companyName,
        description,
        expiry_date: expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    setGeneratedCoupons(coupons);
    toast.success(t("couponsGenerated", { count: quantity }));
  };

  const handleSaveToDatabase = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t("loginFirst"));
      setSaving(false);
      return;
    }
    const batchId = `batch-${Date.now()}`;
    const rows = generatedCoupons.map((c) => ({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      max_discount_value: c.max_discount_value,
      company_name: c.company_name,
      description: c.description,
      expiry_date: c.expiry_date,
      created_by: user.id,
      batch_id: batchId,
      is_unlimited: isUnlimited,
    }));

    const { error } = await supabase.from("coupons").insert(rows);
    if (error) {
      toast.error(t("saveFailed") + error.message);
    } else {
      toast.success(t("couponsSaved"));
    }
    setSaving(false);
  };

  const handleDownloadExcel = () => {
    if (generatedCoupons.length === 0) {
      toast.error(t("generateFirst"));
      return;
    }
    const wsData = generatedCoupons.map((c, i) => ({
      "#": i + 1,
      [t("code")]: c.code,
      [t("discountType")]: c.discount_type === "percentage" ? t("percentage") : t("fixedAmount"),
      [t("discountValue")]: c.discount_value,
      [t("maxDiscountValue")]: c.max_discount_value ?? t("noLimit"),
      [t("company")]: c.company_name || "-",
      [t("description")]: c.description,
      [t("expiryDate")]: new Date(c.expiry_date).toLocaleDateString(),
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    ws["!cols"] = [{ wch: 5 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 20 }, { wch: 30 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Coupons");
    XLSX.writeFile(wb, `GoldenBox_Coupons_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(t("excelDownloaded"));
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label className="text-foreground">{t("codePrefix")}</Label>
          <Input value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} placeholder="GB" className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">{t("codeLength")}</Label>
          <Input type="number" value={codeLength} onChange={(e) => setCodeLength(Number(e.target.value))} min={4} max={16} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">{t("quantity")}</Label>
          <Input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={1} max={1000} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">{t("discountType")}</Label>
          <Select value={discountType} onValueChange={setDiscountType}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">{t("percentage")}</SelectItem>
              <SelectItem value="fixed">{t("fixedAmount")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">{t("discountValue")}</Label>
          <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} min={1} className="bg-secondary border-border" />
        </div>
        {discountType === "percentage" && (
          <div className="space-y-2">
            <Label className="text-foreground">{t("maxDiscountValue")}</Label>
            <Input
              type="number"
              value={maxDiscountValue ?? ""}
              onChange={(e) => setMaxDiscountValue(e.target.value ? Number(e.target.value) : null)}
              placeholder={t("maxDiscountPlaceholder")}
              min={1}
              className="bg-secondary border-border"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label className="text-foreground">{t("expiryDate")}</Label>
          <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">{t("companyName")}</Label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={t("companyNamePlaceholder")} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2 md:col-span-2 lg:col-span-3">
          <Label className="text-foreground">{t("description")}</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("descriptionPlaceholder")} className="bg-secondary border-border" />
        </div>
        <div className="flex items-center gap-3 md:col-span-2 lg:col-span-3">
          <Switch checked={isUnlimited} onCheckedChange={setIsUnlimited} />
          <div>
            <Label className="text-foreground">{t("unlimitedMultiUse")}</Label>
            <p className="text-xs text-muted-foreground">{t("unlimitedNote")}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button onClick={handleGenerate} className="gold-gradient-bg text-primary-foreground font-semibold hover:opacity-90">
          <Sparkles className="me-2 h-4 w-4" /> {t("generateCoupons")}
        </Button>
        {generatedCoupons.length > 0 && (
          <>
            <Button onClick={handleSaveToDatabase} disabled={saving} variant="outline" className="gold-border text-primary hover:bg-primary/10">
              {saving ? t("saving") : t("saveToDatabase")}
            </Button>
            <Button onClick={handleDownloadExcel} variant="outline" className="gold-border text-primary hover:bg-primary/10">
              {t("downloadExcel")}
            </Button>
          </>
        )}
      </div>

      {generatedCoupons.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary">
                  <th className="px-4 py-3 text-start text-muted-foreground font-semibold">#</th>
                  <th className="px-4 py-3 text-start text-muted-foreground font-semibold">{t("code")}</th>
                  <th className="px-4 py-3 text-start text-muted-foreground font-semibold">{t("type")}</th>
                  <th className="px-4 py-3 text-start text-muted-foreground font-semibold">{t("value")}</th>
                  <th className="px-4 py-3 text-start text-muted-foreground font-semibold">{t("maxValue")}</th>
                  <th className="px-4 py-3 text-start text-muted-foreground font-semibold">{t("company")}</th>
                  <th className="px-4 py-3 text-start text-muted-foreground font-semibold">{t("expiry")}</th>
                </tr>
              </thead>
              <tbody>
                {generatedCoupons.map((c, i) => (
                  <tr key={c.code} className="border-t border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-primary font-semibold">{c.code}</td>
                    <td className="px-4 py-3 text-foreground">{c.discount_type === "percentage" ? "%" : t("fixedAmount")}</td>
                    <td className="px-4 py-3 text-foreground">{c.discount_value}{c.discount_type === "percentage" ? "%" : ""}</td>
                    <td className="px-4 py-3 text-foreground">{c.max_discount_value ?? t("noLimit")}</td>
                    <td className="px-4 py-3 text-foreground">{c.company_name || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(c.expiry_date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponGenerator;
