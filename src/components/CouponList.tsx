import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  description: string | null;
  expiry_date: string | null;
  is_active: boolean;
  created_at: string;
  batch_id: string | null;
}

const CouponList = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoupons = async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setCoupons(data);
      setLoading(false);
    };
    fetchCoupons();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (coupons.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg">No coupons saved yet.</p>
        <p className="text-sm mt-1">Generate and save coupons to see them here.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary">
              <th className="px-4 py-3 text-left text-muted-foreground font-semibold">#</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Code</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Type</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Value</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Description</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Expiry</th>
              <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c, i) => (
              <tr key={c.id} className="border-t border-border hover:bg-secondary/50 transition-colors">
                <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                <td className="px-4 py-3 font-mono text-primary font-semibold">{c.code}</td>
                <td className="px-4 py-3 text-foreground">{c.discount_type === "percentage" ? "%" : "Fixed"}</td>
                <td className="px-4 py-3 text-foreground">{c.discount_value}{c.discount_type === "percentage" ? "%" : ""}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.description || "-"}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : "-"}</td>
                <td className="px-4 py-3">
                  <Badge variant={c.is_active ? "default" : "secondary"} className={c.is_active ? "gold-gradient-bg text-primary-foreground" : ""}>
                    {c.is_active ? "Active" : "Inactive"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CouponList;
