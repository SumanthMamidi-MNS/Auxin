"use client";
/**
 * app/farmer/products/page.tsx — Auxin v3.0
 * Farmer Products & Produce Management:
 *  - Responsive .page-content layout
 *  - Search, category filter chips, and stock health indicators
 *  - Inline quick availability switch & edit modal
 */

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, Package, X, Leaf, Search, Zap, CheckCircle2 } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge, EmptyState } from "@/components/ui/Card";
import { productsApi } from "@/lib/products";
import { getErrorMessage } from "@/lib/api";
import { FarmerProductsSkeleton } from "@/components/ui/Skeletons";
import type { Product } from "@/types";
import toast from "react-hot-toast";
import { clsx } from "clsx";

interface ProductForm {
  name: string;
  description: string;
  price: string;
  stock: string;
  unit: string;
  harvest_date: string;
  is_active: boolean;
  image_url: string;
}

const EMPTY_FORM: ProductForm = {
  name: "",
  description: "",
  price: "",
  stock: "",
  unit: "kg",
  harvest_date: "",
  is_active: true,
  image_url: "",
};

const UNITS = ["kg", "g", "litre", "dozen", "piece", "bundle"];

const IMAGE_PRESETS = [
  { name: "🥦 Vegetables", url: "https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&q=80" },
  { name: "🍎 Fruits", url: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80" },
  { name: "🌾 Grains", url: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80" },
  { name: "🥛 Dairy", url: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80" },
  { name: "🌱 Herbs", url: "https://images.unsplash.com/photo-1515002246390-7bf7e8f87b54?w=400&q=80" },
];

const getProductCategory = (p: Product) => {
  if (!p.image_url) return "🥦 Vegetables";
  const matched = IMAGE_PRESETS.find(preset => p.image_url!.includes(preset.url.split("?")[0]));
  if (matched) return matched.name;
  const name = p.name.toLowerCase();
  if (name.match(/(apple|orange|banana|grape|mango|fruit|berry)/)) return "🍎 Fruits";
  if (name.match(/(wheat|rice|grain|flour|corn)/)) return "🌾 Grains";
  if (name.match(/(milk|cheese|butter|dairy|paneer|yogurt)/)) return "🥛 Dairy";
  if (name.match(/(coriander|mint|herb|spinach|basil|rosemary)/)) return "🌱 Herbs";
  return "🥦 Vegetables";
};

const isExpired = (harvestDateStr?: string) => {
  if (!harvestDateStr) return false;
  const harvestDate = new Date(harvestDateStr);
  const diffTime = Math.abs(new Date().getTime() - harvestDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 30;
};

interface AddEditProductModalProps {
  open: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

function AddEditProductModal({ open, onClose, productToEdit }: AddEditProductModalProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<ProductForm>>({});

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [open, onClose]);

  useEffect(() => {
    if (productToEdit) {
      setForm({
        name: productToEdit.name,
        description: productToEdit.description || "",
        price: String(productToEdit.price),
        stock: String(productToEdit.quantity),
        unit: productToEdit.unit,
        harvest_date: productToEdit.harvest_date ? productToEdit.harvest_date.split("T")[0] : "",
        is_active: productToEdit.is_active,
        image_url: productToEdit.image_url || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [productToEdit]);

  const set = (k: keyof ProductForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: Partial<ProductForm> = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.description.trim()) e.description = "Required";
    if (!form.price || Number(form.price) <= 0) e.price = "Must be > 0";
    if (!form.stock || Number(form.stock) < 0) e.stock = "Must be >= 0";
    if (!form.harvest_date) e.harvest_date = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        quantity: Number(form.stock),
        unit: form.unit || "kg",
        harvest_date: form.harvest_date,
        is_active: form.is_active,
        image_url: form.image_url.trim() || undefined,
      };
      return productToEdit
        ? productsApi.update(productToEdit.id, payload)
        : productsApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-products"] });
      toast.success(productToEdit ? "Product updated! 🌿" : "Product added! 🌿");
      setForm(EMPTY_FORM);
      setErrors({});
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-lg max-h-[92dvh] overflow-y-auto animate-slide-up rounded-t-3xl sm:rounded-3xl border shadow-xl bg-[var(--surface)] border-[var(--border)] p-6 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--divider)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--primary-subtle)] border border-[var(--primary-glow)]">
              <Leaf className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <h2 className="text-base font-bold text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
              {productToEdit ? "Edit Product" : "Add Direct Harvest"}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-2)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <Input
          label="Product Name"
          placeholder="e.g. Fresh Tomatoes"
          value={form.name}
          onChange={set("name")}
          error={errors.name}
          required
        />

        <Textarea
          label="Description"
          placeholder="Describe your harvest, farming methods, and taste profile…"
          value={form.description}
          onChange={set("description") as React.ChangeEventHandler<HTMLTextAreaElement>}
          error={errors.description}
          required
          rows={3}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Price (₹)"
            type="number"
            placeholder="0"
            value={form.price}
            onChange={set("price")}
            error={errors.price}
            required
          />
          <Input
            label="Available Stock"
            type="number"
            placeholder="0"
            value={form.stock}
            onChange={set("stock")}
            error={errors.stock}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5 text-xs">
            <label className="text-overline block">Measurement Unit</label>
            <select
              value={form.unit}
              onChange={set("unit") as React.ChangeEventHandler<HTMLSelectElement>}
              className="h-11 px-3 rounded-xl text-xs bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
          <Input
            label="Harvest Date"
            type="date"
            value={form.harvest_date}
            onChange={set("harvest_date")}
            error={errors.harvest_date}
            required
          />
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center justify-between p-3 rounded-2xl border bg-[var(--surface-2)] border-[var(--border)]">
          <div>
            <p className="text-xs font-bold text-[var(--text-primary)]">Marketplace Visibility</p>
            <p className="text-[10px] text-[var(--text-secondary)]">Allow customers to order this harvest</p>
          </div>
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            className="w-4 h-4 rounded accent-[var(--primary)]"
          />
        </div>

        {/* Image Presets */}
        <div className="space-y-1.5">
          <Input
            label="Image URL (Optional)"
            placeholder="Paste image link"
            value={form.image_url}
            onChange={set("image_url")}
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {IMAGE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => setForm((f) => ({ ...f, image_url: preset.url }))}
                className="px-2.5 py-1 rounded-lg border text-[10px] font-bold bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <Button
          fullWidth
          variant="primary"
          size="md"
          loading={saveMutation.isPending}
          onClick={() => validate() && saveMutation.mutate()}
        >
          {productToEdit ? "Save Changes" : "Create Product"}
        </Button>
      </div>
    </div>
  );
}

interface ProductRowProps {
  p: Product;
  onEdit: (p: Product) => void;
  onDelete: (id: number) => void;
  onToggleAvailability: (p: Product) => void;
}

function ProductRow({ p, onEdit, onDelete, onToggleAvailability }: ProductRowProps) {
  const expired = isExpired(p.harvest_date);
  const category = getProductCategory(p);

  return (
    <div
      className="flex gap-4 p-4 rounded-3xl items-center border border-[var(--border)] bg-[var(--surface)] shadow-xs hover:shadow-md transition-all"
    >
      {/* Product Image */}
      <div
        className="w-16 h-16 rounded-2xl overflow-hidden relative flex-shrink-0 flex items-center justify-center border border-[var(--border)] bg-[var(--surface-2)]"
      >
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">🌿</span>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-bold text-sm truncate text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>{p.name}</p>
          {expired && (
            <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20">
              Expired
            </span>
          )}
        </div>
        <p className="text-[10px] font-bold text-[var(--primary)] mt-0.5">{category}</p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
          ₹{p.price}/{p.unit} · <span className="font-bold text-[var(--text-primary)]">{p.quantity} {p.unit}</span> in stock
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {/* Availability Switch */}
        <button
          onClick={() => onToggleAvailability(p)}
          className={clsx(
            "w-10 h-5.5 rounded-full p-0.5 transition-all duration-200 cursor-pointer border border-[var(--border)]",
            p.is_active ? "bg-[var(--primary)]" : "bg-[var(--surface-3)]"
          )}
          title={p.is_active ? "Make Inactive" : "Make Active"}
        >
          <div
            className={clsx(
              "w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-200",
              p.is_active ? "translate-x-4.5" : "translate-x-0"
            )}
          />
        </button>

        {/* Edit & Delete Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(p)}
            className="w-7 h-7 rounded-xl flex items-center justify-center bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all"
            title="Edit"
          >
            <Edit2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(p.id)}
            className="w-7 h-7 rounded-xl flex items-center justify-center bg-[var(--danger-bg)] border border-[var(--danger-border)] text-[var(--danger)] hover:bg-rose-100 transition-all"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FarmerProductsPage() {
  const qc = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data, isLoading } = useQuery({
    queryKey: ["farmer-products"],
    queryFn: () => productsApi.myProducts({ page: 1, page_size: 100 }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-products"] });
      toast.success("Product removed.");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      productsApi.update(id, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-products"] });
      toast.success("Availability updated! 🌾");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleOpenEdit = (p: Product) => {
    setProductToEdit(p);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setProductToEdit(null);
    setShowAddModal(false);
  };

  const handleToggle = (p: Product) => {
    toggleAvailabilityMutation.mutate({ id: p.id, is_active: !p.is_active });
  };

  const CATEGORIES = ["All", "Vegetables", "Fruits", "Grains", "Dairy", "Herbs"];

  const filteredItems = (data?.items ?? []).filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || "").toLowerCase().includes(searchQuery.toLowerCase());

    const cat = getProductCategory(p);
    const cleanCat = cat.replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "").trim();
    const matchesCategory = selectedCategory === "All" || cleanCat.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg)" }}>
      <TopBar
        title="Direct Produce Catalog"
        action={
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Add Harvest
          </Button>
        }
      />

      <div className="page-content py-4 sm:py-6 space-y-5">
        {/* Search & Category Pills */}
        <div className="p-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xs space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
            <input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl text-xs bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={clsx(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                    active
                      ? "bg-[var(--primary)] text-white shadow-xs"
                      : "bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <FarmerProductsSkeleton />
        ) : filteredItems.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<Package className="w-10 h-10 opacity-30 text-[var(--primary)]" />}
              title={searchQuery || selectedCategory !== "All" ? "No matches found" : "No products yet"}
              description={
                searchQuery || selectedCategory !== "All"
                  ? "Try adjusting your search query or category filter"
                  : "Add your first harvest listing to sell directly to regional customers."
              }
              action={
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => setShowAddModal(true)}
                >
                  Add First Harvest
                </Button>
              }
            />
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((p) => (
              <ProductRow
                key={p.id}
                p={p}
                onEdit={handleOpenEdit}
                onDelete={(id) => deleteMutation.mutate(id)}
                onToggleAvailability={handleToggle}
              />
            ))}
          </div>
        )}
      </div>

      <AddEditProductModal
        open={showAddModal}
        onClose={handleCloseModal}
        productToEdit={productToEdit}
      />
    </div>
  );
}
