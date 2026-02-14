import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2, Search, X } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

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
  created_at: string;
  batch_id: string | null;
}

const CouponList = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const { t } = useLanguage();

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

  const filteredCoupons = useMemo(() => {
    return coupons.filter((c) => {
      const q = search.toLowerCase();
      if (q && !c.code.toLowerCase().includes(q) && !(c.company_name || "").toLowerCase().includes(q)) {
        return false;
      }
      if (statusFilter === "active" && (!c.is_active || c.is_consumed)) return false;
      if (statusFilter === "consumed" && !c.is_consumed) return false;
      if (statusFilter === "inactive" && (c.is_active || c.is_consumed)) return false;
      if (dateFrom && c.created_at < dateFrom) return false;
      if (dateTo && c.created_at > dateTo + "T23:59:59") return false;
      return true;
    });
  }, [coupons, search, statusFilter, dateFrom, dateTo]);

  const hasFilters = search || statusFilter !== "all" || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  };

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
        <p className="text-lg">{t("noCoupons")}</p>
        <p className="text-sm mt-1">{t("noCouponsHint")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="ps-9 bg-secondary border-border"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            <SelectItem value="active">{t("active")}</SelectItem>
            <SelectItem value="consumed">{t("consumed")}</SelectItem>
            <SelectItem value="inactive">{t("inactive")}</SelectItem>
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          placeholder={t("dateFrom")}
          className="bg-secondary border-border"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          placeholder={t("dateTo")}
          className="bg-secondary border-border"
        />
      </div>

      {hasFilters && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {filteredCoupons.length} / {coupons.length}
          </span>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
            <X className="me-1 h-4 w-4" /> {t("clearFilters")}
          </Button>
        </div>
      )}

      {filteredCoupons.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t("noResults")}</p>
        </div>
      ) : (
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
                  <th className="px-4 py-3 text-start text-muted-foreground font-semibold">{t("description")}</th>
                  <th className="px-4 py-3 text-start text-muted-foreground font-semibold">{t("expiry")}</th>
                  <th className="px-4 py-3 text-start text-muted-foreground font-semibold">{t("consumedBy")}</th>
                  <th className="px-4 py-3 text-start text-muted-foreground font-semibold">{t("mobile")}</th>
                  <th className="px-4 py-3 text-start text-muted-foreground font-semibold">{t("consumedAt")}</th>
                  <th className="px-4 py-3 text-start text-muted-foreground font-semibold">{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((c, i) => (
                  <tr key={c.id} className="border-t border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 font-mono text-primary font-semibold">{c.code}</td>
                    <td className="px-4 py-3 text-foreground">{c.discount_type === "percentage" ? "%" : t("fixedAmount")}</td>
                    <td className="px-4 py-3 text-foreground">{c.discount_value}{c.discount_type === "percentage" ? "%" : ""}</td>
                    <td className="px-4 py-3 text-foreground">{c.max_discount_value ?? t("noLimit")}</td>
                    <td className="px-4 py-3 text-foreground">{c.company_name || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.description || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : "-"}</td>
                    <td className="px-4 py-3 text-foreground">{c.consumed_by_customer || "-"}</td>
                    <td className="px-4 py-3 text-foreground">{c.consumed_by_mobile || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.consumed_at ? new Date(c.consumed_at).toLocaleDateString() : "-"}</td>
                    <td className="px-4 py-3">
                      {c.is_consumed ? (
                        <Badge variant="secondary">{t("consumed")}</Badge>
                      ) : (
                        <Badge variant={c.is_active ? "default" : "secondary"} className={c.is_active ? "gold-gradient-bg text-primary-foreground" : ""}>
                          {c.is_active ? t("active") : t("inactive")}
                        </Badge>
                      )}
                    </td>
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

export default CouponList;
