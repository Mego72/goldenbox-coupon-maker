import { useEffect, useMemo, useState, useCallback } from "react";
import ConsumptionReport from "./ConsumptionReport";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Search, X, Power, Trash2, Download, Pencil, RotateCcw, ChevronLeft, ChevronRight, RefreshCw, FileText, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { BRANCHES } from "@/constants/branches";

const PAGE_SIZE_OPTIONS = [50, 100, 200, 500] as const;

type SortDirection = "asc" | "desc";
type SortableKey = keyof Coupon;

interface SortLevel {
  key: SortableKey;
  direction: SortDirection;
}

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

const CouponList = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [editCoupon, setEditCoupon] = useState<Coupon | null>(null);
  const [editForm, setEditForm] = useState<Partial<Coupon>>({});
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(50);
  const [showReport, setShowReport] = useState(false);
  const [sortLevels, setSortLevels] = useState<SortLevel[]>([]);
  const { t } = useLanguage();

  const fetchAllCoupons = async () => {
    setLoading(true);
    let allData: Coupon[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
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

  useEffect(() => {
    fetchAllCoupons();
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
      if (branchFilter !== "all" && c.branch_name !== branchFilter) return false;
      if (dateFrom && c.created_at < dateFrom) return false;
      if (dateTo && c.created_at > dateTo + "T23:59:59") return false;
      return true;
    });
  }, [coupons, search, statusFilter, branchFilter, dateFrom, dateTo]);

  const handleSort = useCallback((key: SortableKey, shiftKey: boolean) => {
    setSortLevels((prev) => {
      const existingIndex = prev.findIndex((s) => s.key === key);
      if (existingIndex >= 0) {
        const updated = [...prev];
        if (updated[existingIndex].direction === "asc") {
          updated[existingIndex] = { key, direction: "desc" };
        } else {
          updated.splice(existingIndex, 1);
        }
        return updated;
      }
      if (shiftKey) {
        return [...prev, { key, direction: "asc" }];
      }
      return [{ key, direction: "asc" }];
    });
  }, []);

  const sortedCoupons = useMemo(() => {
    if (sortLevels.length === 0) return filteredCoupons;
    return [...filteredCoupons].sort((a, b) => {
      for (const { key, direction } of sortLevels) {
        const aVal = a[key];
        const bVal = b[key];
        const aNull = aVal == null || aVal === "";
        const bNull = bVal == null || bVal === "";
        if (aNull && bNull) continue;
        if (aNull) return 1;
        if (bNull) return -1;
        let cmp = 0;
        if (typeof aVal === "number" && typeof bVal === "number") {
          cmp = aVal - bVal;
        } else if (typeof aVal === "boolean" && typeof bVal === "boolean") {
          cmp = (aVal ? 1 : 0) - (bVal ? 1 : 0);
        } else {
          cmp = String(aVal).localeCompare(String(bVal));
        }
        if (cmp !== 0) return direction === "asc" ? cmp : -cmp;
      }
      return 0;
    });
  }, [filteredCoupons, sortLevels]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, branchFilter, dateFrom, dateTo, sortLevels, pageSize]);

  const totalPages = Math.ceil(sortedCoupons.length / pageSize);
  const paginatedCoupons = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedCoupons.slice(start, start + pageSize);
  }, [sortedCoupons, currentPage, pageSize]);

  const getSortIndex = (key: SortableKey) => sortLevels.findIndex((s) => s.key === key);
  const getSortDir = (key: SortableKey) => sortLevels.find((s) => s.key === key)?.direction;

  const SortHeader = ({ label, sortKey }: { label: string; sortKey: SortableKey }) => {
    const idx = getSortIndex(sortKey);
    const dir = getSortDir(sortKey);
    return (
      <th
        className="px-4 py-3 text-start text-muted-foreground font-semibold cursor-pointer select-none hover:text-foreground transition-colors"
        onClick={(e) => handleSort(sortKey, e.shiftKey)}
        title={t("sortHint")}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {dir === "asc" ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : dir === "desc" ? (
            <ArrowDown className="h-3 w-3 text-primary" />
          ) : (
            <ChevronsUpDown className="h-3 w-3 opacity-30" />
          )}
          {sortLevels.length > 1 && idx >= 0 && (
            <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full w-4 h-4 inline-flex items-center justify-center">
              {idx + 1}
            </span>
          )}
        </span>
      </th>
    );
  };

  const hasFilters = search || statusFilter !== "all" || branchFilter !== "all" || dateFrom || dateTo;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setBranchFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCoupons.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCoupons.map((c) => c.id)));
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    const newStatus = !coupon.is_active;
    const { error } = await supabase
      .from("coupons")
      .update({ is_active: newStatus })
      .eq("id", coupon.id);
    if (error) {
      toast.error(t("actionFailed"));
    } else {
      setCoupons((prev) => prev.map((c) => c.id === coupon.id ? { ...c, is_active: newStatus } : c));
      toast.success(newStatus ? t("couponActivated") : t("couponDeactivated"));
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(t("confirmDelete"))) return;
    const { error } = await supabase.from("coupons").delete().eq("id", coupon.id);
    if (error) {
      toast.error(t("actionFailed"));
    } else {
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(coupon.id); return next; });
      toast.success(t("couponDeleted"));
    }
  };

  const handleDeleteSelected = async () => {
    const count = selectedIds.size;
    if (!confirm(t("confirmDeleteMultiple", { count }))) return;
    setDeleting(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("coupons").delete().in("id", ids);
    if (error) {
      toast.error(t("actionFailed"));
    } else {
      setCoupons((prev) => prev.filter((c) => !selectedIds.has(c.id)));
      setSelectedIds(new Set());
      toast.success(t("couponsDeleted", { count }));
    }
    setDeleting(false);
  };

  const handleReset = async (coupon: Coupon) => {
    if (!confirm(t("confirmReset"))) return;
    const { error } = await supabase
      .from("coupons")
      .update({
        is_consumed: false,
        consumed_by_customer: null,
        consumed_by_mobile: null,
        consumed_at: null,
        branch_name: null,
        is_active: true,
      })
      .eq("id", coupon.id);
    if (error) {
      toast.error(t("actionFailed"));
    } else {
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === coupon.id
            ? { ...c, is_consumed: false, consumed_by_customer: null, consumed_by_mobile: null, consumed_at: null, branch_name: null, is_active: true }
            : c
        )
      );
      toast.success(t("couponReset"));
    }
  };

  const openEdit = (coupon: Coupon) => {
    setEditCoupon(coupon);
    setEditForm({
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_discount_value: coupon.max_discount_value,
      company_name: coupon.company_name,
      description: coupon.description,
      expiry_date: coupon.expiry_date ? coupon.expiry_date.slice(0, 10) : "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editCoupon) return;
    setSaving(true);
    const updates: Record<string, unknown> = {
      discount_type: editForm.discount_type,
      discount_value: Number(editForm.discount_value),
      max_discount_value: editForm.max_discount_value ? Number(editForm.max_discount_value) : null,
      company_name: editForm.company_name || null,
      description: editForm.description || null,
      expiry_date: editForm.expiry_date || null,
    };
    const { error } = await supabase.from("coupons").update(updates).eq("id", editCoupon.id);
    if (error) {
      toast.error(t("actionFailed"));
    } else {
      setCoupons((prev) =>
        prev.map((c) => (c.id === editCoupon.id ? { ...c, ...updates } as Coupon : c))
      );
      toast.success(t("couponUpdated"));
      setEditCoupon(null);
    }
    setSaving(false);
  };

  const handleExportExcel = () => {
    const wsData = filteredCoupons.map((c, i) => ({
      "#": i + 1,
      [t("code")]: c.code,
      [t("type")]: c.discount_type === "percentage" ? t("percentage") : t("fixedAmount"),
      [t("value")]: c.discount_value,
      [t("maxValue")]: c.max_discount_value ?? t("noLimit"),
      [t("company")]: c.company_name || "-",
      [t("description")]: c.description || "-",
      [t("expiry")]: c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : "-",
      [t("consumedBy")]: c.consumed_by_customer || "-",
      [t("mobile")]: c.consumed_by_mobile || "-",
      [t("consumedAt")]: c.consumed_at ? new Date(c.consumed_at).toLocaleDateString() : "-",
      [t("status")]: c.is_consumed ? t("consumed") : c.is_active ? t("active") : t("inactive"),
      [t("branch")]: c.branch_name || "-",
      [t("creditNumber")]: c.credit_number || "-",
      [t("companyDue")]: c.company_due ?? "-",
    }));
    const ws = XLSX.utils.json_to_sheet(wsData);
    ws["!cols"] = [{ wch: 5 }, { wch: 22 }, { wch: 14 }, { wch: 10 }, { wch: 14 }, { wch: 20 }, { wch: 30 }, { wch: 14 }, { wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Coupons");
    XLSX.writeFile(wb, `GoldenBox_Coupons_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success(t("excelDownloaded"));
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

  const allSelected = filteredCoupons.length > 0 && selectedIds.size === filteredCoupons.length;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
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
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="all">{t("all")}</SelectItem>
            <SelectItem value="active">{t("active")}</SelectItem>
            <SelectItem value="consumed">{t("consumed")}</SelectItem>
            <SelectItem value="inactive">{t("inactive")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="bg-secondary border-border">
            <SelectValue placeholder={t("allBranches")} />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border z-50">
            <SelectItem value="all">{t("allBranches")}</SelectItem>
            {BRANCHES.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
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

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            {filteredCoupons.length} {hasFilters ? `/ ${coupons.length}` : ""} {t("totalCoupons")}
          </span>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-foreground">
              <X className="me-1 h-4 w-4" /> {t("clearFilters")}
            </Button>
          )}
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Trash2 className="h-4 w-4 me-1" />}
              {t("deleteSelected", { count: selectedIds.size })}
            </Button>
          )}
          {sortLevels.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setSortLevels([])} className="text-muted-foreground hover:text-foreground">
              <X className="me-1 h-3 w-3" /> {t("clearSort")}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={fetchAllCoupons} variant="outline" size="sm" disabled={loading} className="text-muted-foreground hover:text-foreground">
            <RefreshCw className={`h-4 w-4 me-1 ${loading ? "animate-spin" : ""}`} /> {t("refresh") || "Refresh"}
          </Button>
          {filteredCoupons.length > 0 && (
            <>
              <Button onClick={() => setShowReport(true)} variant="outline" className="gold-border text-primary hover:bg-primary/10">
                <FileText className="me-2 h-4 w-4" /> {t("report")}
              </Button>
              <Button onClick={handleExportExcel} variant="outline" className="gold-border text-primary hover:bg-primary/10">
                <Download className="me-2 h-4 w-4" /> {t("exportFiltered")}
              </Button>
            </>
          )}
        </div>
      </div>

      {showReport ? (
        <ConsumptionReport coupons={filteredCoupons} onBack={() => setShowReport(false)} />
      ) : filteredCoupons.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t("noResults")}</p>
        </div>
      ) : (
        <div className="space-y-3">
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary">
                  <th className="px-4 py-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label={t("selectAll")}
                    />
                  </th>
                  <th className="px-4 py-3 text-start text-muted-foreground font-semibold">#</th>
                  <SortHeader label={t("code")} sortKey="code" />
                  <SortHeader label={t("type")} sortKey="discount_type" />
                  <SortHeader label={t("value")} sortKey="discount_value" />
                  <SortHeader label={t("maxValue")} sortKey="max_discount_value" />
                  <SortHeader label={t("company")} sortKey="company_name" />
                  <SortHeader label={t("expiry")} sortKey="expiry_date" />
                  <SortHeader label={t("consumedBy")} sortKey="consumed_by_customer" />
                  <SortHeader label={t("mobile")} sortKey="consumed_by_mobile" />
                  <SortHeader label={t("branch")} sortKey="branch_name" />
                  <SortHeader label={t("creditNumber")} sortKey="credit_number" />
                  <SortHeader label={t("companyDue")} sortKey="company_due" />
                  <SortHeader label={t("status")} sortKey="is_active" />
                  <th className="px-4 py-3 text-start text-muted-foreground font-semibold sticky end-0 bg-secondary z-10">{t("actions")}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCoupons.map((c, i) => (
                  <tr key={c.id} className={`border-t border-border transition-colors ${selectedIds.has(c.id) ? "bg-primary/5" : "bg-background hover:bg-secondary/50"}`}>
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedIds.has(c.id)}
                        onCheckedChange={() => toggleSelect(c.id)}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{(currentPage - 1) * pageSize + i + 1}</td>
                    <td className="px-4 py-3 font-mono text-primary font-semibold">{c.code}</td>
                    <td className="px-4 py-3 text-foreground">{c.discount_type === "percentage" ? "%" : t("fixedAmount")}</td>
                    <td className="px-4 py-3 text-foreground">{c.discount_value}{c.discount_type === "percentage" ? "%" : ""}</td>
                    <td className="px-4 py-3 text-foreground">{c.max_discount_value ?? t("noLimit")}</td>
                    <td className="px-4 py-3 text-foreground">{c.company_name || "-"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : "-"}</td>
                    <td className="px-4 py-3 text-foreground">{c.consumed_by_customer || "-"}</td>
                    <td className="px-4 py-3 text-foreground">{c.consumed_by_mobile || "-"}</td>
                    <td className="px-4 py-3 text-foreground">{c.branch_name || "-"}</td>
                    <td className="px-4 py-3 text-foreground">{c.credit_number || "-"}</td>
                    <td className="px-4 py-3 text-foreground">{c.company_due ?? "-"}</td>
                    <td className="px-4 py-3">
                      {c.is_consumed ? (
                        <Badge variant="secondary">{t("consumed")}</Badge>
                      ) : (
                        <Badge variant={c.is_active ? "default" : "secondary"} className={c.is_active ? "gold-gradient-bg text-primary-foreground" : ""}>
                          {c.is_active ? t("active") : t("inactive")}
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 sticky end-0 z-10 bg-inherit">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(c)}
                          className="text-muted-foreground hover:text-primary"
                          title={t("editCoupon")}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {c.is_consumed && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleReset(c)}
                            className="text-blue-500 hover:text-blue-400"
                            title={t("resetCoupon")}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        {!c.is_consumed && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(c)}
                            className={c.is_active ? "text-yellow-500 hover:text-yellow-400" : "text-green-500 hover:text-green-400"}
                            title={c.is_active ? t("deactivate") : t("activate")}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(c)}
                          className="text-destructive hover:text-destructive/80"
                          title={t("deleteCoupon")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
          <div className="flex items-center justify-between px-2 pt-2 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {sortedCoupons.length > 0 ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, sortedCoupons.length)} / ${sortedCoupons.length}` : "0"}
              </span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 w-[90px] bg-secondary border-border text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>{size} / {t("page") || "page"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let page: number;
                if (totalPages <= 7) {
                  page = i + 1;
                } else if (currentPage <= 4) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 3) {
                  page = totalPages - 6 + i;
                } else {
                  page = currentPage - 3 + i;
                }
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="icon"
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 ${page === currentPage ? "gold-gradient-bg text-primary-foreground" : ""}`}
                  >
                    {page}
                  </Button>
                );
              })}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editCoupon} onOpenChange={(open) => !open && setEditCoupon(null)}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{t("editCoupon")} — {editCoupon?.code}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("discountType")}</Label>
                <Select value={editForm.discount_type} onValueChange={(v) => setEditForm((f) => ({ ...f, discount_type: v }))}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    <SelectItem value="percentage">{t("percentage")}</SelectItem>
                    <SelectItem value="fixed">{t("fixedAmount")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("discountValue")}</Label>
                <Input
                  type="number"
                  value={editForm.discount_value ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, discount_value: Number(e.target.value) }))}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("maxDiscountValue")}</Label>
                <Input
                  type="number"
                  value={editForm.max_discount_value ?? ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, max_discount_value: e.target.value ? Number(e.target.value) : null }))}
                  className="bg-secondary border-border"
                  placeholder={t("noLimit")}
                />
              </div>
              <div className="space-y-2">
                <Label>{t("expiryDate")}</Label>
                <Input
                  type="date"
                  value={typeof editForm.expiry_date === "string" ? editForm.expiry_date : ""}
                  onChange={(e) => setEditForm((f) => ({ ...f, expiry_date: e.target.value || null }))}
                  className="bg-secondary border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("companyName")}</Label>
              <Input
                value={editForm.company_name ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, company_name: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("description")}</Label>
              <Input
                value={editForm.description ?? ""}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditCoupon(null)}>{t("cancel")}</Button>
            <Button onClick={handleSaveEdit} disabled={saving} className="gold-gradient-bg text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : null}
              {t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CouponList;
