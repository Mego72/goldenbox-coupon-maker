import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, TicketCheck, TicketX, Ticket, TicketMinus, MapPin } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Coupon {
  id: string;
  is_active: boolean;
  is_consumed: boolean;
  consumed_at: string | null;
  company_name: string | null;
  branch_name: string | null;
  created_at: string;
}

const COLORS = ["hsl(45, 93%, 47%)", "hsl(0, 72%, 51%)", "hsl(220, 13%, 46%)"];

const CouponDashboard = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchAll = async () => {
      let allData: Coupon[] = [];
      let from = 0;
      const pageSize = 1000;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from("coupons")
          .select("id, is_active, is_consumed, consumed_at, company_name, branch_name, created_at")
          .range(from, from + pageSize - 1);
        if (error || !data) {
          hasMore = false;
        } else {
          allData = [...allData, ...data];
          hasMore = data.length === pageSize;
          from += pageSize;
        }
      }
      setCoupons(allData);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const stats = useMemo(() => {
    const total = coupons.length;
    const active = coupons.filter((c) => c.is_active && !c.is_consumed).length;
    const consumed = coupons.filter((c) => c.is_consumed).length;
    const inactive = coupons.filter((c) => !c.is_active && !c.is_consumed).length;
    return { total, active, consumed, inactive };
  }, [coupons]);

  const pieData = useMemo(() => [
    { name: t("activeCoupons"), value: stats.active },
    { name: t("consumedCoupons"), value: stats.consumed },
    { name: t("inactiveCoupons"), value: stats.inactive },
  ], [stats, t]);

  const trendData = useMemo(() => {
    const now = new Date();
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days[d.toISOString().slice(0, 10)] = 0;
    }
    coupons.forEach((c) => {
      if (c.consumed_at) {
        const day = c.consumed_at.slice(0, 10);
        if (day in days) days[day]++;
      }
    });
    return Object.entries(days).map(([date, count]) => ({
      date: date.slice(5),
      count,
    }));
  }, [coupons]);

  const topCompanies = useMemo(() => {
    const map: Record<string, number> = {};
    coupons.forEach((c) => {
      const name = c.company_name || "-";
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [coupons]);

  const branchData = useMemo(() => {
    const map: Record<string, { total: number; consumed: number }> = {};
    coupons.forEach((c) => {
      if (c.branch_name) {
        if (!map[c.branch_name]) map[c.branch_name] = { total: 0, consumed: 0 };
        map[c.branch_name].total++;
        if (c.is_consumed) map[c.branch_name].consumed++;
      }
    });
    return Object.entries(map)
      .map(([name, d]) => ({ name, consumed: d.consumed, total: d.total }))
      .sort((a, b) => b.consumed - a.consumed);
  }, [coupons]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: t("totalCoupons"), value: stats.total, icon: Ticket, color: "text-primary" },
    { label: t("activeCoupons"), value: stats.active, icon: TicketCheck, color: "text-green-500" },
    { label: t("consumedCoupons"), value: stats.consumed, icon: TicketMinus, color: "text-yellow-500" },
    { label: t("inactiveCoupons"), value: stats.inactive, icon: TicketX, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="bg-secondary border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-3xl font-bold text-foreground mt-1">{s.value}</p>
                </div>
                <s.icon className={`h-8 w-8 ${s.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consumption Trend */}
        <Card className="lg:col-span-2 bg-secondary border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">{t("consumptionTrend")} <span className="text-sm text-muted-foreground font-normal">({t("last30Days")})</span></CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trendData}>
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                />
                <Bar dataKey="count" fill="hsl(45, 93%, 47%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="bg-secondary border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">{t("statusDistribution")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={3}>
                  {pieData.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--secondary))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 justify-center mt-2">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                  {d.name} ({d.value})
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Companies */}
        <Card className="bg-secondary border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg">{t("topCompanies")}</CardTitle>
          </CardHeader>
          <CardContent>
            {topCompanies.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("noData")}</p>
            ) : (
              <div className="space-y-3">
                {topCompanies.map((c) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <span className="text-foreground text-sm">{c.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 rounded-full bg-background overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(c.count / stats.total) * 100}%`,
                            background: "hsl(45, 93%, 47%)",
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-8 text-end">{c.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Branch Breakdown */}
        <Card className="bg-secondary border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              {t("branchBreakdown")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {branchData.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t("noData")}</p>
            ) : (
              <div className="space-y-4">
                {branchData.map((b) => (
                  <div key={b.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground text-sm font-medium">{b.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {b.consumed} / {b.total}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-background overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${b.total > 0 ? (b.consumed / b.total) * 100 : 0}%`,
                          background: "hsl(45, 93%, 47%)",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CouponDashboard;
