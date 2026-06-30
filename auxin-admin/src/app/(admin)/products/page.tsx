"use client";
/**
 * app/(admin)/products/page.tsx — Auxin Admin v2.0
 * Product management table with search and deactivate action.
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Package, ChevronLeft, ChevronRight, PowerOff } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/admin";
import { Badge, SectionHeader, Spinner, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Product, PaginatedResponse } from "@/types";

/* ── Deactivate button ──────────────────────────────────────────────────── */
function DeactivateButton({ product }: { product: Product }) {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => adminApi.deactivateProduct(product.id),
    onSuccess: () => {
      toast.success(`"${product.name}" deactivated`);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: () => toast.error("Failed to deactivate product"),
  });

  if (!product.is_active) {
    return <Badge label="inactive" />;
  }

  return (
    <Button
      variant="danger"
      size="xs"
      icon={<PowerOff className="w-3.5 h-3.5" />}
      loading={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      Deactivate
    </Button>
  );
}

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery<PaginatedResponse<Product>>({
    queryKey: ["admin-products", page],
    queryFn: () =>
      adminApi.listProducts({ page, page_size: 30 }).then((r) => r.data as PaginatedResponse<Product>),
    staleTime: 20_000,
  });

  const products = data?.items ?? [];

  /* Client-side search */
  const filtered = search.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.farmer_name?.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
        <div>
          <SectionHeader
            title="Product Management"
            subtitle={`${data?.total ?? 0} total products`}
          />
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52525B]" />
          <input
            type="search"
            placeholder="Search product or farmer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 pl-9 pr-4 rounded-xl border border-[#27272A] bg-[#18181B] text-[#F4F4F5] text-sm placeholder:text-[#52525B] w-64 focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-[#EF4444] text-sm">
          Failed to load products.
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="w-7 h-7" />}
          title="No products found"
          description={search ? "Try a different search term." : "No products listed yet."}
        />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#27272A]">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Product</th>
                <th>Farmer</th>
                <th>Price / Unit</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => (
                <tr key={product.id}>
                  <td>
                    <span className="font-mono text-xs text-[#71717A]">
                      #{product.id}
                    </span>
                  </td>
                  <td>
                    <div className="flex flex-col max-w-[200px]">
                      <span className="font-semibold text-[#F4F4F5] line-clamp-1">
                        {product.name}
                      </span>
                      {product.description && (
                        <span className="text-xs text-[#71717A] line-clamp-1 mt-0.5">
                          {product.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-[#A1A1AA]">
                    {product.farmer_name ?? `Farmer #${product.farmer_id}`}
                  </td>
                  <td>
                    <span className="font-semibold text-[#F4F4F5]">
                      ₹{Number(product.price ?? 0).toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-[#71717A] ml-1">/{product.unit}</span>
                  </td>
                  <td>
                    <span
                      className="font-semibold"
                      style={{
                        color: product.quantity < 10 ? "#F59E0B" : "#A1A1AA",
                      }}
                    >
                      {product.quantity}
                    </span>
                    <span className="text-xs text-[#71717A] ml-1">{product.unit}</span>
                  </td>
                  <td>
                    <Badge label={product.is_active ? "active" : "inactive"} dot />
                  </td>
                  <td>
                    <DeactivateButton product={product} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!isLoading && (data?.total_pages ?? 1) > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#71717A]">
            Page {page} of {data?.total_pages} · {data?.total ?? 0} products
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              icon={<ChevronLeft className="w-3.5 h-3.5" />}
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="xs"
              iconRight={<ChevronRight className="w-3.5 h-3.5" />}
              disabled={page >= (data?.total_pages ?? 1)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
