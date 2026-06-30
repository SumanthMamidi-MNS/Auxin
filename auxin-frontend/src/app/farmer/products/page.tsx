"use client";
/**
 * app/farmer/products/page.tsx — Auxin v2.0
 * Premium dark farmer product management with add/delete.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Package, X, Leaf } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge, EmptyState, Spinner } from "@/components/ui/Card";
import { productsApi } from "@/lib/products";
import { getErrorMessage } from "@/lib/api";
import type { Product } from "@/types";
import toast from "react-hot-toast";

interface ProductForm {
  name: string; description: string; price: string;
  stock: string; unit: string; harvest_date: string;
}

const EMPTY_FORM: ProductForm = {
  name: "", description: "", price: "",
  stock: "", unit: "kg", harvest_date: "",
};

const UNITS = ["kg", "g", "litre", "dozen", "piece", "bundle"];

function AddProductModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<ProductForm>>({});

  const set = (k: keyof ProductForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: Partial<ProductForm> = {};
    if (!form.name.trim())        e.name = "Required";
    if (!form.description.trim()) e.description = "Required";
    if (!form.price || Number(form.price) <= 0) e.price = "Must be > 0";
    if (!form.stock || Number(form.stock) < 0)  e.stock = "Required";
    if (!form.harvest_date) e.harvest_date = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const createMutation = useMutation({
    mutationFn: () =>
      productsApi.create({
        name:         form.name.trim(),
        description:  form.description.trim(),
        price:        Number(form.price),
        quantity:     Number(form.stock),
        unit:         form.unit || "kg",
        harvest_date: form.harvest_date,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-products"] });
      toast.success("Product added! 🌿");
      setForm(EMPTY_FORM);
      setErrors({});
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full max-w-lg max-h-[92dvh] overflow-y-auto animate-slide-up rounded-t-3xl sm:rounded-3xl"
        style={{ background: "#111113", border: "1px solid #27272A" }}
      >
        {/* Handle bar (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#27272A]" />
        </div>

        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: "rgba(34,197,94,0.1)" }}
              >
                <Leaf className="w-4 h-4 text-[#22C55E]" />
              </div>
              <h2 className="text-lg font-bold text-[#FAFAFA]">Add Product</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-[#71717A] hover:text-[#FAFAFA] hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
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
            placeholder="Describe your product, how it was grown…"
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
              label="Stock Quantity"
              type="number"
              placeholder="0"
              value={form.stock}
              onChange={set("stock")}
              error={errors.stock}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Unit select */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#FAFAFA]">Unit</label>
              <select
                value={form.unit}
                onChange={set("unit") as React.ChangeEventHandler<HTMLSelectElement>}
                className="h-11 px-4 rounded-xl text-sm text-[#FAFAFA] focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 transition-all"
                style={{
                  background: "#18181B",
                  border: "1px solid #27272A",
                  colorScheme: "dark",
                }}
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

          <Button
            fullWidth
            variant="primary"
            size="lg"
            loading={createMutation.isPending}
            icon={<Plus className="w-4 h-4" />}
            onClick={() => validate() && createMutation.mutate()}
          >
            Add Product
          </Button>
        </div>
      </div>
    </div>
  );
}

function ProductRow({ p, onDelete }: { p: Product; onDelete: (id: number) => void }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
      style={{ background: "#111113", border: "1px solid #27272A" }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
        style={{ background: "#18181B" }}
      >
        🌿
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-[#FAFAFA] text-sm truncate">{p.name}</p>
        <p className="text-xs text-[#71717A] mt-0.5">
          ₹{p.price}/{p.unit} · {p.quantity} {p.unit} left
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Badge label={p.is_active ? "active" : "inactive"} dot />
        <button
          onClick={() => onDelete(p.id)}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all active:scale-90"
          style={{ background: "rgba(239,68,68,0.08)" }}
        >
          <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
        </button>
      </div>
    </div>
  );
}

export default function FarmerProductsPage() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["farmer-products"],
    queryFn: () => productsApi.myProducts({ page: 1, page_size: 50 }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["farmer-products"] });
      toast.success("Product removed.");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A0A0B" }}>
      <TopBar
        title="My Products"
        action={
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAdd(true)}
          >
            Add
          </Button>
        }
      />

      <div className="px-4 py-5 space-y-3">
        {/* Summary bar */}
        {!isLoading && data && (
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-[#22C55E]" />
            <p className="text-sm text-[#A1A1AA]">
              <span className="font-bold text-[#FAFAFA]">{data.total ?? data.items.length}</span>{" "}
              products listed
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : !data?.items.length ? (
          <EmptyState
            icon={<Package className="w-8 h-8" />}
            title="No products yet"
            description="Add your first product to start selling on Auxin"
            action={
              <Button
                variant="primary"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setShowAdd(true)}
              >
                Add First Product
              </Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {data.items.map((p) => (
              <ProductRow key={p.id} p={p} onDelete={(id) => deleteMutation.mutate(id)} />
            ))}
          </div>
        )}
      </div>

      <AddProductModal open={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
