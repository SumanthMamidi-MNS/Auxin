"use client";
/**
 * app/(admin)/catalogue/page.tsx — Auxin Admin v3.0
 * Master Catalogue Product management page.
 *
 * Allows Admins to:
 *   - Browse all master catalogue products (canonical listings)
 *   - Search and filter by category
 *   - Create a new master catalogue product
 *   - Edit product specifications (unit, shelf life, seasonal status, storage instructions, nutrition, active state)
 *   - Trigger Bulk Import & Export simulation
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Search, SlidersHorizontal, Package, Eye, EyeOff, Save, X, Calendar, RefreshCw, Download, Upload } from "lucide-react";
import { catalogueApi, type MasterProduct } from "@/lib/catalogue";
import { getErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";

interface ProductFormState {
  category_id: string;
  name: string;
  slug: string;
  description: string;
  default_unit: string;
  image_url: string;
  tags: string;
  storage_info: string;
  nutrition_info: string;
  shelf_life_days: string;
  is_seasonal: boolean;
  display_order: string;
}

const DEFAULT_FORM: ProductFormState = {
  category_id: "",
  name: "",
  slug: "",
  description: "",
  default_unit: "kg",
  image_url: "",
  tags: "",
  storage_info: "",
  nutrition_info: "",
  shelf_life_days: "",
  is_seasonal: false,
  display_order: "0",
};

export default function AdminCatalogueProductsPage() {
  const qc = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<ProductFormState>(DEFAULT_FORM);
  const [editingProduct, setEditingProduct] = useState<MasterProduct | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProductFormState> & { is_active?: boolean }>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCatSlug, setSelectedCatSlug] = useState("");
  const [page, setPage] = useState(1);

  // Fetch categories (for filter and dropdown selectors)
  const { data: categories } = useQuery({
    queryKey: ["admin-catalogue-categories"],
    queryFn: () => catalogueApi.categories().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["admin-catalogue-products", searchQuery, selectedCatSlug, page],
    queryFn: () =>
      catalogueApi
        .list({
          page,
          page_size: 25,
          category: selectedCatSlug || undefined,
          q: searchQuery || undefined,
        })
        .then((r) => r.data),
    refetchInterval: 30000,
  });

  const products = productsData?.items ?? [];
  const total = productsData?.total ?? 0;
  const totalPages = productsData?.total_pages ?? 0;

  // ── Mutation: Create Product ──
  const createMutation = useMutation({
    mutationFn: (data: ProductFormState) =>
      catalogueApi.createProduct({
        category_id: Number(data.category_id),
        name: data.name,
        slug: data.slug,
        description: data.description || undefined,
        default_unit: data.default_unit,
        image_url: data.image_url || undefined,
        tags: data.tags || undefined,
        storage_info: data.storage_info || undefined,
        shelf_life_days: data.shelf_life_days ? Number(data.shelf_life_days) : undefined,
        is_seasonal: data.is_seasonal,
        display_order: Number(data.display_order),
      }),
    onSuccess: () => {
      toast.success("Master product created!");
      qc.invalidateQueries({ queryKey: ["admin-catalogue-products"] });
      setForm(DEFAULT_FORM);
      setShowAddForm(false);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // ── Mutation: Update Product ──
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      catalogueApi.updateProduct(id, data),
    onSuccess: () => {
      toast.success("Product updated successfully!");
      qc.invalidateQueries({ queryKey: ["admin-catalogue-products"] });
      setEditingProduct(null);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category_id || !form.name.trim() || !form.slug.trim()) {
      toast.error("Category, Name and Slug are required.");
      return;
    }
    createMutation.mutate(form);
  };

  const handleEditClick = (prod: MasterProduct) => {
    setEditingProduct(prod);
    setEditForm({
      category_id: String(prod.category_id),
      name: prod.name,
      slug: prod.slug,
      description: prod.description || "",
      default_unit: prod.default_unit,
      image_url: prod.image_url || "",
      tags: prod.tags || "",
      storage_info: prod.storage_info || "",
      nutrition_info: (prod as any).nutrition_info || "",
      shelf_life_days: prod.shelf_life_days ? String(prod.shelf_life_days) : "",
      is_seasonal: prod.is_seasonal,
      display_order: String(prod.display_order),
      is_active: prod.is_active,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const payload: any = {
      category_id: Number(editForm.category_id),
      name: editForm.name,
      slug: editForm.slug,
      description: editForm.description || null,
      default_unit: editForm.default_unit,
      image_url: editForm.image_url || null,
      tags: editForm.tags || null,
      storage_info: editForm.storage_info || null,
      nutrition_info: editForm.nutrition_info || null,
      shelf_life_days: editForm.shelf_life_days ? Number(editForm.shelf_life_days) : null,
      is_seasonal: editForm.is_seasonal,
      is_active: editForm.is_active,
      display_order: Number(editForm.display_order),
    };

    updateMutation.mutate({ id: editingProduct.id, data: payload });
  };

  const categoryOptions = categories?.map((c) => ({ id: c.id, label: c.name })) ?? [];

  // Bulk operation actions
  const handleBulkImport = () => {
    toast.success("Bulk import module loaded! (Future-ready simulated trigger)");
  };

  const handleBulkExport = () => {
    toast.success("Catalog exported successfully as CSV! (Simulated download)");
  };

  return (
    <div className="space-y-6 text-[#FAFAFA] bg-[#09090B]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1F1F23] pb-5">
        <div>
          <h1 className="text-2xl font-black text-[#FAFAFA] tracking-tight">Master Catalogue</h1>
          <p className="text-xs text-[#A1A1AA] font-semibold mt-1">Manage master inventory catalog definitions</p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleBulkImport}
            className="h-10 px-3.5 rounded-xl border border-[#27272A] hover:bg-[#161618] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer text-[#A1A1AA] hover:text-[#FAFAFA]"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
          <button
            onClick={handleBulkExport}
            className="h-10 px-3.5 rounded-xl border border-[#27272A] hover:bg-[#161618] text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer text-[#A1A1AA] hover:text-[#FAFAFA]"
          >
            <Download className="w-3.5 h-3.5" />
            Export
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="h-10 px-4 rounded-xl bg-[#22C55E] text-[#052E16] text-xs font-black flex items-center gap-1.5 hover:bg-[#22C55E]/90 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Master Product
          </button>
        </div>
      </div>

      {/* Creation form */}
      {showAddForm && (
        <div className="border border-[#27272A] rounded-2xl p-5 bg-[#111113] space-y-4 max-w-2xl">
          <h2 className="text-sm font-black text-[#FAFAFA] flex items-center gap-2">
            <Package className="w-4 h-4 text-[#22C55E]" /> Add Master Catalog Product
          </h2>
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-semibold">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Product Name *</label>
                <input
                  type="text" required
                  placeholder="e.g. Fresh Organic Carrots"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })}
                  className="w-full px-3 h-9 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Slug *</label>
                <input
                  type="text" required
                  placeholder="e.g. fresh-organic-carrots"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  className="w-full px-3 h-9 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Category *</label>
                <select
                  required
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full px-3 h-9 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none bg-white text-gray-700"
                >
                  <option value="">Select Category</option>
                  {categoryOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Default Unit</label>
                <select
                  value={form.default_unit}
                  onChange={(e) => setForm({ ...form, default_unit: e.target.value })}
                  className="w-full px-3 h-9 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none bg-white text-gray-700"
                >
                  {["kg", "piece", "litre", "bunch", "dozen", "pack"].map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Shelf Life (Days)</label>
                <input
                  type="number"
                  placeholder="e.g. 7"
                  value={form.shelf_life_days}
                  onChange={(e) => setForm({ ...form, shelf_life_days: e.target.value })}
                  className="w-full px-3 h-9 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Display Order</label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm({ ...form, display_order: e.target.value })}
                  className="w-full px-3 h-9 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Image URL</label>
              <input
                type="text"
                placeholder="https://..."
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full px-3 h-9 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Description</label>
              <textarea
                placeholder="Product description..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none h-16"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Storage Information</label>
                <input
                  type="text"
                  placeholder="e.g. Keep refrigerated below 5°C"
                  value={form.storage_info}
                  onChange={(e) => setForm({ ...form, storage_info: e.target.value })}
                  className="w-full px-3 h-9 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Nutrition Information</label>
                <input
                  type="text"
                  placeholder="e.g. Vitamin A: 120%, Calories: 41 kcal"
                  value={form.nutrition_info}
                  onChange={(e) => setForm({ ...form, nutrition_info: e.target.value })}
                  className="w-full px-3 h-9 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 py-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.is_seasonal}
                  onChange={(e) => setForm({ ...form, is_seasonal: e.target.checked })}
                  className="w-4 h-4 rounded bg-[#0F0F10] border border-[#27272A] text-[#22C55E]"
                />
                <span className="text-xs text-[#F4F4F5]">Seasonal Highlight</span>
              </label>
            </div>

            <div className="flex gap-2 justify-end border-t border-[#27272A] pt-4">
              <button
                type="button"
                onClick={() => { setShowAddForm(false); setForm(DEFAULT_FORM); }}
                className="px-4 h-9 rounded-xl border border-[#27272A] text-xs font-bold text-[#A1A1AA] hover:text-[#F4F4F5]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-4 h-9 rounded-xl bg-[#22C55E] text-[#052E16] text-xs font-bold hover:bg-[#22C55E]/90 disabled:opacity-60"
              >
                {createMutation.isPending ? "Creating..." : "Create Product"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Editing product modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#111113] border border-[#27272A] rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[#27272A] pb-3 mb-4">
              <h2 className="text-sm font-black text-[#FAFAFA] flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#22C55E]" /> Edit Product Specifications
              </h2>
              <button onClick={() => setEditingProduct(null)} className="text-[#A1A1AA] hover:text-[#FAFAFA]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs font-semibold">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Product Name</label>
                  <input
                    type="text" required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 h-9 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Slug</label>
                  <input
                    type="text" required
                    value={editForm.slug}
                    onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                    className="w-full px-3 h-9 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Category</label>
                  <select
                    value={editForm.category_id}
                    onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                    className="w-full px-3 h-9 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none bg-white text-gray-700"
                  >
                    {categoryOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Default Unit</label>
                  <select
                    value={editForm.default_unit}
                    onChange={(e) => setEditForm({ ...editForm, default_unit: e.target.value })}
                    className="w-full px-3 h-9 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none bg-white text-gray-700"
                  >
                    {["kg", "piece", "litre", "bunch", "dozen", "pack"].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Shelf Life (Days)</label>
                  <input
                    type="number"
                    value={editForm.shelf_life_days}
                    onChange={(e) => setEditForm({ ...editForm, shelf_life_days: e.target.value })}
                    className="w-full px-3 h-9 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Display Order</label>
                  <input
                    type="number"
                    value={editForm.display_order}
                    onChange={(e) => setEditForm({ ...editForm, display_order: e.target.value })}
                    className="w-full px-3 h-9 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Image URL</label>
                <input
                  type="text"
                  value={editForm.image_url}
                  onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                  className="w-full px-3 h-9 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Description</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none h-16"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Storage Information</label>
                  <input
                    type="text"
                    value={editForm.storage_info}
                    onChange={(e) => setEditForm({ ...editForm, storage_info: e.target.value })}
                    className="w-full px-3 h-9 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Nutrition Information</label>
                  <input
                    type="text"
                    value={editForm.nutrition_info}
                    onChange={(e) => setEditForm({ ...editForm, nutrition_info: e.target.value })}
                    className="w-full px-3 h-9 rounded-xl bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center py-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editForm.is_seasonal}
                    onChange={(e) => setEditForm({ ...editForm, is_seasonal: e.target.checked })}
                    className="w-4 h-4 rounded bg-[#0F0F10] border border-[#27272A] text-[#22C55E]"
                  />
                  <span className="text-xs text-[#F4F4F5]">Seasonal</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="w-4 h-4 rounded bg-[#0F0F10] border border-[#27272A] text-[#22C55E]"
                  />
                  <span className="text-xs text-[#F4F4F5]">Active in Catalogue</span>
                </label>
              </div>

              <div className="flex gap-2 justify-end border-t border-[#27272A] pt-4">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 h-9 rounded-xl border border-[#27272A] text-xs font-bold text-[#A1A1AA] hover:text-[#F4F4F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="px-4 h-9 rounded-xl bg-[#22C55E] text-[#052E16] text-xs font-bold hover:bg-[#22C55E]/90 disabled:opacity-60"
                >
                  {updateMutation.isPending ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-1 flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-72">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#71717A]">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search master products..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 h-10 rounded-xl bg-[#161618] border border-[#27272A] text-xs text-[#F4F4F5] focus:border-[#22C55E] focus:outline-none"
            />
          </div>

          <div className="w-full sm:w-48">
            <select
              value={selectedCatSlug}
              onChange={(e) => { setSelectedCatSlug(e.target.value); setPage(1); }}
              className="w-full h-10 px-3 rounded-xl border border-[#27272A] bg-[#161618] text-xs text-[#FAFAFA] font-bold focus:outline-none bg-white text-gray-700"
            >
              <option value="">All Categories</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-8 h-8 rounded-lg border border-[#27272A] flex items-center justify-center text-xs font-bold disabled:opacity-40"
          >
            &lt;
          </button>
          <span className="text-xs font-bold text-[#A1A1AA] font-mono">
            Page {page} of {totalPages || 1}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || totalPages === 0}
            className="w-8 h-8 rounded-lg border border-[#27272A] flex items-center justify-center text-xs font-bold disabled:opacity-40"
          >
            &gt;
          </button>
        </div>
      </div>

      {/* Catalog items table list */}
      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-[#22C55E]" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-12 h-12 text-[#71717A]" />}
          title="No master products found"
          description="Click 'Add Master Product' to create your first catalog definition."
        />
      ) : (
        <div className="border border-[#1F1F23] rounded-3xl overflow-hidden bg-[#111113] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#1F1F23] text-[#71717A] font-black uppercase tracking-wider bg-[#161618]">
                  <th className="px-5 py-4">Product Name</th>
                  <th className="px-5 py-4">Slug</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Default Unit</th>
                  <th className="px-5 py-4">Shelf Life</th>
                  <th className="px-5 py-4">Storage Info</th>
                  <th className="px-5 py-4">Visibility</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F23] font-semibold text-[#FAFAFA]">
                {products.map((prod) => (
                  <tr key={prod.id} className="hover:bg-[#161618]/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {prod.image_url ? (
                          <img src={prod.image_url} alt={prod.name} className="w-8 h-8 rounded-lg object-cover border border-[#27272A]" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[#27272A]/40 flex items-center justify-center">
                            <Package className="w-4 h-4 text-[#71717A]" />
                          </div>
                        )}
                        <div>
                          <span className="font-extrabold text-sm">{prod.name}</span>
                          {prod.is_seasonal && (
                            <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded bg-amber-950/20 border border-amber-900/30 text-amber-500 font-black uppercase tracking-wider">
                              Seasonal
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-[10px] text-[#A1A1AA]">{prod.slug}</td>
                    <td className="px-5 py-4 text-xs font-black">{prod.category_name || "—"}</td>
                    <td className="px-5 py-4">{prod.default_unit}</td>
                    <td className="px-5 py-4">{prod.shelf_life_days ? `${prod.shelf_life_days} days` : "—"}</td>
                    <td className="px-5 py-4 text-[#A1A1AA] max-w-xxs truncate" title={prod.storage_info || ""}>
                      {prod.storage_info || "—"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                        prod.is_active ? "bg-emerald-950/20 border border-emerald-900/30 text-[#22C55E]" : "bg-red-950/20 border border-red-900/30 text-[#EF4444]"
                      }`}>
                        {prod.is_active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {prod.is_active ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleEditClick(prod)}
                        className="p-2 rounded-lg bg-[#161618] border border-[#27272A] text-[#22C55E] hover:bg-[#22C55E]/10 hover:border-[#22C55E]/20 transition-all cursor-pointer inline-flex items-center gap-1 font-bold text-[10px]"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Specs
                      </button>
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
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="border border-[#1F1F23] rounded-3xl p-12 text-center bg-[#111113] space-y-3">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
        {icon}
      </div>
      <div>
        <h3 className="font-extrabold text-sm text-[#FAFAFA]">{title}</h3>
        <p className="text-xs text-[#A1A1AA] mt-1 max-w-sm mx-auto leading-relaxed">{description}</p>
      </div>
    </div>
  );
}
