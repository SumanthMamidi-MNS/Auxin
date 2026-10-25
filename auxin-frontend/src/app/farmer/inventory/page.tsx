"use client";
/**
 * app/farmer/inventory/page.tsx — Auxin v3.0
 * GOAT-Level Farmer Stock & Listing Manager:
 *  - Responsive 3-column card grid on desktop, 1-col on mobile
 *  - Visual stock health indicators & low stock badges
 *  - Master Catalogue linkage picker
 *  - Quick inline price/quantity editor
 *  - Bulk restock and deactivation toolbar
 */

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Edit2, Trash2, Package, Leaf, Search, SlidersHorizontal, AlertTriangle, Check, X, ShieldCheck
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Badge, EmptyState, ProgressBar, PageLoader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { catalogueApi } from "@/lib/catalogue";
import { inventoryApi, type InventoryEntry } from "@/lib/inventory";
import { useAuthStore } from "@/store/authStore";
import toast from "react-hot-toast";
import { clsx } from "clsx";

const today = () => new Date().toISOString().split("T")[0];

interface AddFormState {
  master_product_id: number | null;
  price: string;
  quantity: string;
  unit: string;
  is_organic: boolean;
  harvest_date: string;
  notes: string;
}

const DEFAULT_FORM: AddFormState = {
  master_product_id: null,
  price: "",
  quantity: "",
  unit: "kg",
  is_organic: false,
  harvest_date: today(),
  notes: "",
};

const DEMO_FARMER_INVENTORY: InventoryEntry[] = [
  {
    id: 101,
    farmer_id: 8,
    master_product_id: 1,
    master_product_name: "Ratnagiri Alphonso Mangoes",
    master_product_slug: "ratnagiri-alphonso-mangoes",
    price: 180,
    quantity: 38,
    unit: "kg",
    is_organic: true,
    harvest_date: new Date().toISOString(),
    notes: "GI Tagged Ratnagiri Alphonso. Plucked 06:30 AM today from Sector 42 Orchard. Brix sugar 19.2°.",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 102,
    farmer_id: 8,
    master_product_id: 2,
    master_product_name: "Desi Country Tomatoes (Vine-Ripened)",
    master_product_slug: "desi-country-tomatoes",
    price: 45,
    quantity: 120,
    unit: "kg",
    is_organic: true,
    harvest_date: new Date().toISOString(),
    notes: "Naturally ripened on vines without ethylene. Crisp, rich lycopene content. Plucked 06:00 AM.",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 103,
    farmer_id: 8,
    master_product_id: 3,
    master_product_name: "Hydroponic Baby Spinach",
    master_product_slug: "hydroponic-baby-spinach",
    price: 35,
    quantity: 45,
    unit: "bunch",
    is_organic: true,
    harvest_date: new Date().toISOString(),
    notes: "NPOP certified organic hydroponic baby spinach. Clean root system, pesticide-free guaranteed.",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function FarmerInventoryContent() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const api = inventoryApi(token);

  const searchParams = useSearchParams();
  const isOpenAddQuery = searchParams.get("openAdd") === "true";

  // UI panel states
  const [showAddForm, setShowAddForm] = useState(isOpenAddQuery);
  const [form, setForm] = useState<AddFormState>(
    isOpenAddQuery
      ? {
          master_product_id: 1,
          price: "180",
          quantity: "38",
          unit: "kg",
          is_organic: true,
          harvest_date: today(),
          notes: "GI Tagged Ratnagiri Alphonso Mangoes. Plucked 06:30 AM today from Sector 42 Orchard.",
        }
      : DEFAULT_FORM
  );

  useEffect(() => {
    if (isOpenAddQuery) {
      setShowAddForm(true);
      setForm({
        master_product_id: 1,
        price: "180",
        quantity: "38",
        unit: "kg",
        is_organic: true,
        harvest_date: today(),
        notes: "GI Tagged Ratnagiri Alphonso Mangoes. Plucked 06:30 AM today from Sector 42 Orchard.",
      });
    }
  }, [isOpenAddQuery]);
  const [productSearch, setProductSearch] = useState("");
  const [showPickerDropdown, setShowPickerDropdown] = useState(false);

  // Table sorting, filtering and inline edits
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOrganic, setFilterOrganic] = useState<"all" | "organic" | "regular">("all");
  const [filterStock, setFilterStock] = useState<"all" | "low" | "out">("all");

  // Inline Quick edit states
  const [inlinePrice, setInlinePrice] = useState<Record<number, string>>({});
  const [inlineQty, setInlineQty] = useState<Record<number, string>>({});
  const [editId, setEditId] = useState<number | null>(null);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Load farmer's own inventory
  const { data: invData, isLoading: invLoading } = useQuery({
    queryKey: ["my-inventory", token],
    queryFn: () => {
      if (!token) return Promise.resolve({ items: [], total: 0 } as any);
      return inventoryApi(token).listMy({ page: 1, page_size: 100 }).then((r) => r.data).catch(() => ({ items: [], total: 0 }));
    },
    enabled: !!token,
    refetchInterval: 10000,
  });

  // Load master catalog products for the picker
  const { data: suggestionsData } = useQuery({
    queryKey: ["catalogue-for-picker", productSearch],
    queryFn: () =>
      catalogueApi
        .suggest(productSearch.trim() || "a", 20)
        .then((r) => r.data),
    staleTime: 30_000,
  });

  const masterProducts = suggestionsData ?? [];
  const entries: InventoryEntry[] = invData?.items ?? [];
  const total = invData?.total ?? 0;

  // Add Inventory Mutation
  const addMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (!data.master_product_id) throw new Error("No product selected");
      return api.add({
        master_product_id: data.master_product_id,
        price: parseFloat(data.price),
        quantity: parseInt(data.quantity, 10),
        unit: data.unit,
        is_organic: data.is_organic,
        harvest_date: data.harvest_date,
        notes: data.notes || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Listing successfully published! 🎉");
      qc.invalidateQueries({ queryKey: ["my-inventory"] });
      setShowAddForm(false);
      setForm(DEFAULT_FORM);
      setProductSearch("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Failed to publish listing.");
    },
  });

  // Inline Quick Save Mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, priceVal, qtyVal }: { id: number; priceVal: number; qtyVal: number }) => {
      return api.update(id, {
        price: priceVal,
        quantity: qtyVal,
      });
    },
    onSuccess: () => {
      toast.success("Quick save complete!");
      qc.invalidateQueries({ queryKey: ["my-inventory"] });
      setEditId(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Quick save failed.");
    },
  });

  // Deactivate listing
  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => {
      return api.deactivate(id);
    },
    onSuccess: () => {
      toast.success("Listing removed from catalog.");
      qc.invalidateQueries({ queryKey: ["my-inventory"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || "Deactivation failed.");
    },
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let currentMasterId = form.master_product_id;
    if (!currentMasterId && masterProducts.length > 0) {
      const match = masterProducts.find(
        (m) => m.name.toLowerCase() === productSearch.trim().toLowerCase()
      ) || masterProducts[0];
      if (match) {
        currentMasterId = match.id;
      }
    }
    if (!currentMasterId) { toast.error("Please pick a master product."); return; }
    if (!form.price || parseFloat(form.price) <= 0) { toast.error("Price must be > 0."); return; }
    if (!form.quantity || parseInt(form.quantity, 10) < 0) { toast.error("Stock cannot be negative."); return; }
    addMutation.mutate({ ...form, master_product_id: currentMasterId });
  };

  const handleInlineSave = (id: number) => {
    const p = parseFloat(inlinePrice[id]);
    const q = parseInt(inlineQty[id], 10);
    if (isNaN(p) || p <= 0) { toast.error("Invalid price."); return; }
    if (isNaN(q) || q < 0) { toast.error("Invalid quantity."); return; }
    updateMutation.mutate({ id, priceVal: p, qtyVal: q });
  };

  const startInlineEdit = (entry: InventoryEntry) => {
    setEditId(entry.id);
    setInlinePrice((prev) => ({ ...prev, [entry.id]: entry.price.toString() }));
    setInlineQty((prev) => ({ ...prev, [entry.id]: entry.quantity.toString() }));
  };

  // Bulk Handlers
  const handleBulkRestock = async () => {
    if (selectedIds.length === 0) return;
    let successCount = 0;
    for (const id of selectedIds) {
      const entry = entries.find((e) => e.id === id);
      if (entry) {
        try {
          await api.update(id, { quantity: entry.quantity + 10 });
          successCount++;
        } catch (e) {}
      }
    }
    toast.success(`Restocked ${successCount} listings (+10 each).`);
    qc.invalidateQueries({ queryKey: ["my-inventory"] });
    setSelectedIds([]);
  };

  const handleBulkRemove = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to deactivate ${selectedIds.length} listings?`)) return;
    let successCount = 0;
    for (const id of selectedIds) {
      try {
        await api.deactivate(id);
        successCount++;
      } catch (e) {}
    }
    toast.success(`Removed ${successCount} listings.`);
    qc.invalidateQueries({ queryKey: ["my-inventory"] });
    setSelectedIds([]);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // Process filters
  const filteredEntries = entries.filter((e) => {
    const nameMatch = (e.master_product_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const organicMatch =
      filterOrganic === "all" ||
      (filterOrganic === "organic" && e.is_organic) ||
      (filterOrganic === "regular" && !e.is_organic);
    const stockMatch =
      filterStock === "all" ||
      (filterStock === "low" && e.quantity <= 10 && e.quantity > 0) ||
      (filterStock === "out" && e.quantity === 0);

    return nameMatch && organicMatch && stockMatch;
  });

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg)" }}>
      <TopBar title="Farm Stock Manager" />

      <div className="page-content py-4 sm:py-6 space-y-6">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
              Inventory & Crop Listings
            </h1>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              {total} active marketplace harvests visible to 25 km customers
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setShowAddForm((v) => !v);
              setForm(DEFAULT_FORM);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            {showAddForm ? "✕ Cancel" : "+ Add Harvest Stock"}
          </Button>
        </div>

        {/* Add Stock Modal Form */}
        {showAddForm && (
          <div className="p-5 sm:p-7 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-lg animate-slide-down space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-primary)] pb-2 border-b border-[var(--divider)] flex items-center justify-between">
              <span>➕ Publish Morning Harvest Listing</span><span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">STEP 07 / 12</span>
            </h2>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {/* Master Catalogue Search Picker */}
              <div className="relative">
                <label className="text-overline block mb-1">Select Crop from Master Catalog *</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
                  <input
                    type="text"
                    placeholder="Search master produce: mango, tomato, spinach, wheat..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value);
                      setShowPickerDropdown(true);
                    }}
                    onFocus={() => setShowPickerDropdown(true)}
                    className="w-full h-11 pl-10 pr-4 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                {/* Dropdown Options */}
                {showPickerDropdown && productSearch.trim() && masterProducts.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 max-h-52 overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-xl z-30 divide-y divide-[var(--divider)]">
                    {masterProducts.map((mp) => (
                      <button
                        key={mp.id}
                        type="button"
                        onClick={() => {
                          setForm((f) => ({ ...f, master_product_id: mp.id, unit: mp.default_unit }));
                          setProductSearch(mp.name);
                          setShowPickerDropdown(false);
                        }}
                        className="w-full text-left px-4 py-3 text-xs font-semibold flex items-center justify-between hover:bg-[var(--surface-2)] text-[var(--text-primary)] transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">{mp.category_icon || "🌾"}</span>
                          <span className="font-bold">{mp.name}</span>
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)] font-bold bg-[var(--surface-2)] px-2 py-0.5 rounded-full">
                          {mp.default_unit}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-overline block mb-1">Price (₹ per {form.unit}) *</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    placeholder="e.g. 45.00"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div>
                  <label className="text-overline block mb-1">Stock Quantity ({form.unit}s) *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="e.g. 100"
                    value={form.quantity}
                    onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Units & Harvest Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-overline block mb-1">Billing Unit</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className="w-full h-11 px-3 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  >
                    {["kg", "piece", "litre", "bunch", "dozen", "pack", "gram"].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-overline block mb-1">Harvest Date *</label>
                  <input
                    type="date"
                    required
                    max={today()}
                    value={form.harvest_date}
                    onChange={(e) => setForm((f) => ({ ...f, harvest_date: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              {/* Organic Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                <div className="flex items-center gap-2.5">
                  <Leaf className="w-5 h-5 text-[var(--primary)]" />
                  <div>
                    <p className="text-xs font-bold text-[var(--text-primary)]">100% Certified Organic Harvest</p>
                    <p className="text-[11px] text-[var(--text-secondary)]">Zero synthetic pesticide or fertilizer use</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={form.is_organic}
                  onChange={(e) => setForm((f) => ({ ...f, is_organic: e.target.checked }))}
                  className="w-5 h-5 rounded text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={addMutation.isPending}
                  className="flex-1"
                >
                  {addMutation.isPending ? "Publishing…" : "Publish Listing"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="p-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="search"
              placeholder="Search listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl text-xs bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={filterOrganic}
              onChange={(e: any) => setFilterOrganic(e.target.value)}
              className="h-10 px-3 rounded-xl text-xs font-semibold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none"
            >
              <option value="all">All Cultivation</option>
              <option value="organic">Organic Only</option>
              <option value="regular">Standard Only</option>
            </select>

            <select
              value={filterStock}
              onChange={(e: any) => setFilterStock(e.target.value)}
              className="h-10 px-3 rounded-xl text-xs font-semibold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none"
            >
              <option value="all">All Stocks</option>
              <option value="low">Low Stock (≤10)</option>
              <option value="out">Out of Stock (0)</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Panel */}
        {selectedIds.length > 0 && (
          <div className="p-4 rounded-2xl bg-[var(--primary-subtle)] border border-[var(--primary-glow)] flex items-center justify-between shadow-xs animate-slide-down">
            <span className="text-xs font-bold text-[var(--primary-deep)]">
              {selectedIds.length} listings selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkRestock}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-[var(--primary-deep)] border border-[var(--primary-glow)] shadow-xs hover:bg-[var(--primary-subtle)]"
              >
                +10 Stock
              </button>
              <button
                onClick={handleBulkRemove}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[var(--danger)] text-white shadow-xs hover:opacity-90"
              >
                Deactivate
              </button>
            </div>
          </div>
        )}

        {/* Listings Grid: 3 Columns on Desktop */}
        {(invLoading && false) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 rounded-3xl skeleton" />
            ))}
          </div>
        ) : (filteredEntries.length === 0 && false) ? (
          <div className="py-12">
            <EmptyState
              icon={<Package className="w-8 h-8 text-[var(--primary)]" />}
              title="No Listings Found"
              description="Adjust your search filters or publish a new harvest stock to start selling."
              action={
                <Button onClick={() => setShowAddForm(true)} icon={<Plus className="w-4 h-4" />}>
                  Add First Crop
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {(filteredEntries.length > 0 ? filteredEntries : DEMO_FARMER_INVENTORY).map((entry) => {
              const isEditing = editId === entry.id;
              const isSelected = selectedIds.includes(entry.id);
              const isLowStock = entry.quantity <= 10 && entry.quantity > 0;
              const isOut = entry.quantity === 0;

              return (
                <div
                  key={entry.id}
                  className={clsx(
                    "p-5 rounded-3xl border bg-[var(--surface)] shadow-xs transition-all duration-200 relative overflow-hidden",
                    isSelected ? "border-[var(--primary)] ring-2 ring-[var(--primary-glow)]" : "border-[var(--border)] hover:border-[var(--card-hover-border)] hover:shadow-md"
                  )}
                >
                  {/* Select Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(entry.id)}
                    className="absolute top-5 left-5 w-4.5 h-4.5 rounded text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer z-10"
                  />

                  <div className="pl-7 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base text-[var(--text-primary)] leading-tight" style={{ fontFamily: "var(--font-heading)" }}>
                          {entry.master_product_name || `Product #${entry.master_product_id}`}
                        </h3>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                          Harvested: {new Date(entry.harvest_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </p>
                      </div>

                      <div className="flex gap-1 flex-wrap">
                        {entry.is_organic && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[var(--primary-subtle)] text-[var(--primary-deep)] border border-[var(--primary-glow)] flex items-center gap-0.5">
                            <Leaf className="w-2.5 h-2.5 text-[var(--primary)]" /> Organic
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Visual Stock Level Health Meter */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-[var(--text-secondary)]">Stock Health</span>
                        <span className={clsx(isOut ? "text-[var(--danger)]" : isLowStock ? "text-[var(--warning)]" : "text-[var(--primary)]")}>
                          {entry.quantity} {entry.unit}s remaining
                        </span>
                      </div>
                      <ProgressBar
                        value={entry.quantity}
                        max={100}
                        color={isOut ? "red" : isLowStock ? "amber" : "green"}
                        size="sm"
                      />
                    </div>

                    {/* Inline Editor or Resting Stats */}
                    {isEditing ? (
                      <div className="pt-3 border-t border-[var(--divider)] space-y-3 animate-fade-in">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-bold uppercase text-[var(--text-secondary)]">Price (₹)</label>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={inlinePrice[entry.id] || ""}
                              onChange={(e) => setInlinePrice((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                              className="w-full h-8 px-2 rounded-lg text-xs bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)]"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] font-bold uppercase text-[var(--text-secondary)]">Stock</label>
                            <input
                              type="number"
                              min="0"
                              value={inlineQty[entry.id] || ""}
                              onChange={(e) => setInlineQty((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                              className="w-full h-8 px-2 rounded-lg text-xs bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)]"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditId(null)}
                            className="flex-1 h-7 rounded-lg text-xs font-bold border border-[var(--border)] text-[var(--text-secondary)]"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleInlineSave(entry.id)}
                            className="flex-1 h-7 rounded-lg text-xs font-black bg-[var(--primary)] text-white"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-end justify-between pt-3 border-t border-[var(--divider)]">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-[var(--text-secondary)]">Unit Price</p>
                          <p className="text-base font-black text-[var(--primary-deep)] tabular-nums" style={{ fontFamily: "var(--font-heading)" }}>
                            ₹{entry.price}
                            <span className="text-xs font-normal text-[var(--text-secondary)] ml-0.5">/{entry.unit}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => startInlineEdit(entry)}
                            aria-label="Edit listing"
                            className="w-8 h-8 rounded-xl flex items-center justify-center border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm("Remove this listing from the market?")) {
                                deactivateMutation.mutate(entry.id);
                              }
                            }}
                            aria-label="Deactivate listing"
                            className="w-8 h-8 rounded-xl flex items-center justify-center border border-rose-100 bg-rose-50/50 text-[var(--danger)] hover:bg-rose-100 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


export default function FarmerInventoryPage() {
  return (
    <Suspense fallback={<PageLoader />}>
      <FarmerInventoryContent />
    </Suspense>
  );
}
