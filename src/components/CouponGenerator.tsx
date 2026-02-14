import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import * as XLSX from "xlsx";

interface GeneratedCoupon {
  code: string;
  discount_type: string;
  discount_value: number;
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
  const [prefix, setPrefix] = useState("GB");
  const [codeLength, setCodeLength] = useState(8);
  const [quantity, setQuantity] = useState(10);
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState(10);
  const [description, setDescription] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
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
        description,
        expiry_date: expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }
    setGeneratedCoupons(coupons);
    toast.success(`${quantity} coupons generated!`);
  };

  const handleSaveToDatabase = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Please login first");
      setSaving(false);
      return;
    }
    const batchId = `batch-${Date.now()}`;
    const rows = generatedCoupons.map((c) => ({
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      description: c.description,
      expiry_date: c.expiry_date,
      created_by: user.id,
      batch_id: batchId,
    }));

    const { error } = await supabase.from("coupons").insert(rows);
    if (error) {
      toast.error("Failed to save: " + error.message);
    } else {
      toast.success("Coupons saved to database!");
    }
    setSaving(false);
  };

  const handleDownloadExcel = () => {
    if (generatedCoupons.length === 0) {
      toast.error("Generate coupons first!");
      return;
    }
    const wsData = generatedCoupons.map((c, i) => ({
      "#": i + 1,
      "Coupon Code": c.code,
      "Discount Type": c.discount_type === "percentage" ? "Percentage (%)" : "Fixed Amount",
      "Discount Value": c.discount_value,
      "Description": c.description,
      "Expiry Date": new Date(c.expiry_date).toLocaleDateString(),
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    ws["!cols"] = [{ wch: 5 }, { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 30 }, { wch: 14 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Coupons");
    XLSX.writeFile(wb, `GoldenBox_Coupons_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Excel file downloaded!");
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label className="text-foreground">Code Prefix</Label>
          <Input value={prefix} onChange={(e) => setPrefix(e.target.value.toUpperCase())} placeholder="GB" className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Code Length</Label>
          <Input type="number" value={codeLength} onChange={(e) => setCodeLength(Number(e.target.value))} min={4} max={16} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Quantity</Label>
          <Input type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min={1} max={1000} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Discount Type</Label>
          <Select value={discountType} onValueChange={setDiscountType}>
            <SelectTrigger className="bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
              <SelectItem value="fixed">Fixed Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Discount Value</Label>
          <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} min={1} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2">
          <Label className="text-foreground">Expiry Date</Label>
          <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="bg-secondary border-border" />
        </div>
        <div className="space-y-2 md:col-span-2 lg:col-span-3">
          <Label className="text-foreground">Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Summer sale discount..." className="bg-secondary border-border" />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button onClick={handleGenerate} className="gold-gradient-bg text-primary-foreground font-semibold hover:opacity-90">
          <Sparkles className="mr-2 h-4 w-4" /> Generate Coupons
        </Button>
        {generatedCoupons.length > 0 && (
          <>
            <Button onClick={handleSaveToDatabase} disabled={saving} variant="outline" className="gold-border text-primary hover:bg-primary/10">
              {saving ? "Saving..." : "💾 Save to Database"}
            </Button>
            <Button onClick={handleDownloadExcel} variant="outline" className="gold-border text-primary hover:bg-primary/10">
              📥 Download Excel
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
                  <th className="px-4 py-3 text-left text-muted-foreground font-semibold">#</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Code</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Type</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Value</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {generatedCoupons.map((c, i) => (
                  <tr key={c.code} className="border-t border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-primary font-semibold">{c.code}</td>
                    <td className="px-4 py-3 text-foreground">{c.discount_type === "percentage" ? "%" : "Fixed"}</td>
                    <td className="px-4 py-3 text-foreground">{c.discount_value}{c.discount_type === "percentage" ? "%" : ""}</td>
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
