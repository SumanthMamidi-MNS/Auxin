"use client";
/**
 * app/(admin)/catalogue/categories/page.tsx — Auxin Admin v3.0
 * Master Catalogue Categories management page.
 *
 * Allows Admins to:
 *   - Browse categories (both root and subcategories)
 *   - Create a new category
 *   - Edit category details (name, slug, parent, emoji, display order, is_active status)
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit2, Folder, ChevronDown, ChevronRight, Layers, Eye, EyeOff, Save, X } from "lucide-react";
import { catalogueApi, type Category } from "@/lib/catalogue";
import { getErrorMessage } from "@/lib/api";
import toast from "react-hot-toast";

interface CategoryFormState {
  name: string;
  slug: string;
  parent_id: string;
  icon_emoji: string;
  display_order: string;
}

const DEFAULT_FORM: CategoryFormState = {
  name: "",
  slug: "",
  parent_id: "",
  icon_emoji: "",
  display_order: "0",
};

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState<CategoryFormState>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<CategoryFormState> & { is_active?: boolean }>({});
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

  // Fetch categories from backend
  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => catalogueApi.categories().then((r) => r.data),
    refetchInterval: 30000,
  });

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ── Mutation: Create ──
  const createMutation = useMutation({
    mutationFn: (data: CategoryFormState) =>
      catalogueApi.createCategory({
        name: data.name,
        slug: data.slug,
        parent_id: data.parent_id ? Number(data.parent_id) : null,
        icon_emoji: data.icon_emoji || null,
        display_order: Number(data.display_order),
      }),
    onSuccess: () => {
      toast.success("Category created!");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setForm(DEFAULT_FORM);
      setShowAddForm(false);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  // ── Mutation: Update ──
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      catalogueApi.updateCategory(id, data),
    onSuccess: () => {
      toast.success("Category updated!");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setEditingId(null);
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error("Name and Slug are required.");
      return;
    }
    createMutation.mutate(form);
  };

  const handleEditSubmit = (e: React.FormEvent, id: number) => {
    e.preventDefault();
    const payload: any = {};
    if (editForm.name) payload.name = editForm.name;
    if (editForm.slug) payload.slug = editForm.slug;
    if (editForm.parent_id !== undefined) {
      payload.parent_id = editForm.parent_id ? Number(editForm.parent_id) : null;
    }
    if (editForm.icon_emoji !== undefined) payload.icon_emoji = editForm.icon_emoji;
    if (editForm.display_order !== undefined) payload.display_order = Number(editForm.display_order);
    if (editForm.is_active !== undefined) payload.is_active = editForm.is_active;

    updateMutation.mutate({ id, data: payload });
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditForm({
      name: cat.name,
      slug: cat.slug,
      parent_id: cat.parent_id ? String(cat.parent_id) : "",
      icon_emoji: cat.icon_emoji || "",
      display_order: String(cat.display_order),
      is_active: cat.is_active,
    });
  };

  // Flattened active root category list for parent category select dropdown
  const rootOptions = (categories ?? []).filter((c) => c.parent_id === null && c.is_active);

  const renderCategoryRow = (cat: Category, depth = 0) => {
    const isEditing = editingId === cat.id;
    const hasChildren = cat.subcategories && cat.subcategories.length > 0;
    const isExpanded = !!expandedIds[cat.id];

    return (
      <div key={cat.id} className="space-y-1">
        <div
          className="flex items-center gap-3 p-3.5 rounded-xl border transition-colors bg-[#18181B] border-[#27272A] hover:bg-[#27272A]/30"
          style={{ marginLeft: `${depth * 24}px` }}
        >
          {/* Toggle Expand Arrow */}
          <button
            onClick={() => toggleExpand(cat.id)}
            className={`w-6 h-6 rounded flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#27272A] ${
              !hasChildren ? "opacity-0 pointer-events-none" : ""
            }`}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          {/* Icon / Emoji */}
          <div className="w-8 h-8 rounded-lg bg-[#27272A] flex items-center justify-center text-base">
            {cat.icon_emoji ?? "📁"}
          </div>

          {/* Details / Edit Form Inline */}
          {isEditing ? (
            <form
              onSubmit={(e) => handleEditSubmit(e, cat.id)}
              className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-2.5 items-center"
            >
              <input
                type="text"
                placeholder="Name"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                className="px-2.5 h-8 rounded bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5]"
              />
              <input
                type="text"
                placeholder="Slug"
                value={editForm.slug}
                onChange={(e) => setEditForm((f) => ({ ...f, slug: e.target.value }))}
                className="px-2.5 h-8 rounded bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5]"
              />
              <input
                type="text"
                placeholder="Emoji"
                value={editForm.icon_emoji}
                onChange={(e) => setEditForm((f) => ({ ...f, icon_emoji: e.target.value }))}
                className="px-2.5 h-8 rounded bg-[#0F0F10] border border-[#27272A] text-xs text-center text-[#F4F4F5]"
              />
              <input
                type="number"
                placeholder="Order"
                value={editForm.display_order}
                onChange={(e) => setEditForm((f) => ({ ...f, display_order: e.target.value }))}
                className="px-2.5 h-8 rounded bg-[#0F0F10] border border-[#27272A] text-xs text-[#F4F4F5]"
              />
              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex-1 h-8 rounded bg-[#22C55E] text-[#052E16] text-xs font-bold flex items-center justify-center gap-1 hover:bg-[#22C55E]/90"
                >
                  <Save size={12} />
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="w-8 h-8 rounded bg-[#27272A] text-[#A1A1AA] hover:text-[#F4F4F5] flex items-center justify-center"
                >
                  <X size={12} />
                </button>
              </div>
            </form>
          ) : (
            <div className="flex-1 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm text-[#F4F4F5]">
                  {cat.name}
                  {!cat.is_active && (
                    <span className="ml-2 text-[10px] bg-red-950 border border-red-900 text-red-400 px-2 py-0.5 rounded-full">
                      Inactive
                    </span>
                  )}
                </p>
                <p className="text-xs text-[#71717A] mt-0.5">slug: {cat.slug} · order: {cat.display_order}</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Deactivate / Reactivate button */}
                <button
                  onClick={() =>
                    updateMutation.mutate({
                      id: cat.id,
                      data: { is_active: !cat.is_active },
                    })
                  }
                  className={`p-1.5 rounded hover:bg-[#27272A] ${
                    cat.is_active ? "text-amber-500" : "text-emerald-500"
                  }`}
                  title={cat.is_active ? "Deactivate" : "Activate"}
                >
                  {cat.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                {/* Edit Button */}
                <button
                  onClick={() => startEdit(cat)}
                  className="p-1.5 rounded text-blue-400 hover:text-blue-300 hover:bg-[#27272A]"
                  title="Edit details"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Render children subcategories */}
        {hasChildren && isExpanded && (
          <div className="space-y-1">
            {cat.subcategories!.map((sub) => renderCategoryRow(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
        <div>
          <h2 className="text-lg font-bold text-[#F4F4F5]">Catalogue Categories</h2>
          <p className="text-xs text-[#71717A] mt-0.5">Manage master database categories and subcategories</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm((f) => !f);
            setForm(DEFAULT_FORM);
          }}
          className="flex items-center gap-2 bg-[#22C55E] hover:bg-[#22C55E]/90 text-[#052E16] px-4 h-10 rounded-xl text-sm font-bold transition-all"
        >
          <Plus size={16} />
          New Category
        </button>
      </div>

      {/* Add New Category form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateSubmit}
          className="p-5 rounded-2xl border border-[#27272A] bg-[#18181B] space-y-4 animate-fade-in"
        >
          <h3 className="font-bold text-sm text-[#F4F4F5]">Add New Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Vegetables"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 h-10 rounded-xl bg-[#0F0F10] border border-[#27272A] text-sm text-[#F4F4F5] focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Slug</label>
              <input
                type="text"
                required
                placeholder="e.g. vegetables"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                className="w-full px-3 h-10 rounded-xl bg-[#0F0F10] border border-[#27272A] text-sm text-[#F4F4F5] focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Parent (optional)</label>
              <select
                value={form.parent_id}
                onChange={(e) => setForm((f) => ({ ...f, parent_id: e.target.value }))}
                className="w-full px-3 h-10 rounded-xl bg-[#0F0F10] border border-[#27272A] text-sm text-[#F4F4F5] focus:outline-none focus:border-[#22C55E]"
              >
                <option value="">-- None (Root Category) --</option>
                {rootOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.icon_emoji} {opt.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Icon/Emoji (optional)</label>
              <input
                type="text"
                placeholder="e.g. 🥦"
                value={form.icon_emoji}
                onChange={(e) => setForm((f) => ({ ...f, icon_emoji: e.target.value }))}
                className="w-full px-3 h-10 rounded-xl bg-[#0F0F10] border border-[#27272A] text-sm text-[#F4F4F5] focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#71717A] uppercase font-bold block mb-1">Display Order</label>
              <input
                type="number"
                placeholder="e.g. 1"
                value={form.display_order}
                onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
                className="w-full px-3 h-10 rounded-xl bg-[#0F0F10] border border-[#27272A] text-sm text-[#F4F4F5] focus:outline-none focus:border-[#22C55E]"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 h-9 rounded-xl border border-[#27272A] text-xs font-bold text-[#A1A1AA] hover:text-[#F4F4F5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 h-9 rounded-xl bg-[#22C55E] text-[#052E16] text-xs font-bold hover:bg-[#22C55E]/90 disabled:opacity-60"
            >
              {createMutation.isPending ? "Creating..." : "Create Category"}
            </button>
          </div>
        </form>
      )}

      {/* Main category listing */}
      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-16 rounded-xl animate-pulse bg-[#18181B]" />
          ))
        ) : (categories ?? []).length === 0 ? (
          <div className="text-center py-16 border border-[#27272A] bg-[#18181B] rounded-2xl">
            <Layers className="w-12 h-12 mx-auto text-[#52525B] mb-2" />
            <p className="font-bold text-sm text-[#F4F4F5]">No categories found</p>
            <p className="text-xs text-[#71717A] mt-1">Create one using the button above to begin.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {(categories ?? []).map((cat) => renderCategoryRow(cat, 0))}
          </div>
        )}
      </div>
    </div>
  );
}
