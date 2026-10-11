"use client";
/**
 * app/(admin)/products/page.tsx — Auxin Admin v2.0
 * Premium Product Inventory Workspace with dynamic category keywords, stock state sorting, and profile drawers.
 * Keeps deactivation/activation mutations, queries, and APIs fully intact.
 */
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Package, ChevronLeft, ChevronRight, PowerOff, Power, Eye, X, Filter, Tag, Box, Info, Calendar, User } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/admin";
import { Badge, Card, SectionHeader, Spinner, EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { Product, PaginatedResponse } from "@/types";

/* ── Image Presets Resolver ──────────────────────────────────────────────── */
const PRODUCT_IMAGES: Record<string, string> = {
  tomato:    "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400&q=80",
  mango:     "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400&q=80",
  rice:      "https://images.unsplash.com/photo-1536304993881-ff86e6d42a46?w=400&q=80",
  spinach:   "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80",
  potato:    "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80",
  onion:     "https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=400&q=80",
  wheat:     "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=80",
  carrot:    "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80",
  brinjal:   "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=400&q=80",
  apple:     "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80",
  banana:    "https://images.unsplash.com/photo-1603833665858-e61d17a86224?w=400&q=80",
  lemon:     "https://images.unsplash.com/photo-1582476561868-cd4d22d7cd1e?w=400&q=80",
  cucumber:  "https://images.unsplash.com/photo-1568584711075-3d021a7c3ca3?w=400&q=80",
  capsicum:  "https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=400&q=80",
  default:   "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&q=80",
};

const getProductImage = (name: string, url?: string | null): string => {
  if (url && url.trim() !== "") return url;
  const key = name.toLowerCase();
  for (const k of Object.keys(PRODUCT_IMAGES)) {
    if (key.includes(k)) return PRODUCT_IMAGES[k];
  }
  return PRODUCT_IMAGES.default;
};

/* ── Category Classification Helper ──────────────────────────────────────── */
const getProductCategory = (name?: string | null): string => {
  const n = (name || "").toLowerCase();
  if (n.includes("tomato") || n.includes("potato") || n.includes("onion") || n.includes("chilli") || 
      n.includes("cabbage") || n.includes("spinach") || n.includes("carrot") || n.includes("cucumber") || 
      n.includes("garlic") || n.includes("ginger") || n.includes("vegetable") || n.includes("coriander")) {
    return "Vegetables";
  }
  if (n.includes("apple") || n.includes("banana") || n.includes("mango") || n.includes("orange") || 
      n.includes("grape") || n.includes("lemon") || n.includes("fruit") || n.includes("papaya") || n.includes("strawberry")) {
    return "Fruits";
  }
  if (n.includes("milk") || n.includes("egg") || n.includes("butter") || n.includes("cheese") || 
      n.includes("paneer") || n.includes("curd") || n.includes("ghee") || n.includes("dairy")) {
    return "Dairy & Eggs";
  }
  if (n.includes("rice") || n.includes("wheat") || n.includes("dal") || n.includes("grain") || 
      n.includes("cereal") || n.includes("flour") || n.includes("maize") || n.includes("pulse")) {
    return "Grains & Cereals";
  }
  return "Others";
};

/* ── Product Action Trigger ─────────────────────────────────────────────── */
function ProductActions({ product }: { product: Product }) {
  const qc = useQueryClient();

  const deactivateMutation = useMutation({
    mutationFn: () => adminApi.deactivateProduct(product?.id ?? 0),
    onSuccess: () => {
      toast.success(`"${product?.name ?? "Product"}" is deactivated`, {
        icon: "📴",
        style: { background: "#111113", color: "#FAFAFA", border: "1px solid #1F1F23" }
      });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: () => toast.error("Failed to deactivate product"),
  });

  const activateMutation = useMutation({
    mutationFn: () => adminApi.activateProduct(product?.id ?? 0),
    onSuccess: () => {
      toast.success(`"${product?.name ?? "Product"}" is now active 🟢`, {
        style: { background: "#111113", color: "#FAFAFA", border: "1px solid #1F1F23" }
      });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    },
    onError: () => toast.error("Failed to activate product"),
  });

  if (!product?.is_active) {
    return (
      <Button
        variant="outline"
        size="xs"
        className="border-emerald-900/30 text-[#22C55E] bg-emerald-950/10 hover:bg-emerald-950/20"
        loading={activateMutation.isPending}
        onClick={() => {
          if (product?.id !== undefined) activateMutation.mutate();
        }}
      >
        Activate
      </Button>
    );
  }

  return (
    <Button
      variant="danger"
      size="xs"
      className="bg-red-950/20 text-[#EF4444] border-red-900/30 hover:bg-red-950/30"
      loading={deactivateMutation.isPending}
      onClick={() => {
        if (product?.id !== undefined) deactivateMutation.mutate();
      }}
    >
      Deactivate
    </Button>
  );
}

/* ── Main Catalog Page ──────────────────────────────────────────────────── */
export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [availabilityFilter, setAvailabilityFilter] = useState<"All" | "Active" | "Inactive">("All");
  const [stockFilter, setStockFilter] = useState<"All" | "In Stock" | "Low Stock" | "Out of Stock">("All");
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setSelectedProduct(null);
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = "";
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [selectedProduct]);

  // Load products list
  const { data, isLoading, isError } = useQuery<PaginatedResponse<Product>>({
    queryKey: ["admin-products", page],
    queryFn: () =>
      adminApi.listProducts({ page, page_size: 50 }).then((r) => r.data as PaginatedResponse<Product>),
    staleTime: 20_000,
  });

  const products = data?.items ?? [];
  const totalPages = data?.total_pages ?? 1;

  // Filter products locally based on multiple selectors
  const filtered = (products ?? []).filter((p) => {
    const matchesSearch =
      !search.trim() ||
      (p?.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p?.farmer_name && p.farmer_name.toLowerCase().includes(search.toLowerCase())) ||
      `farmer #${p?.farmer_id ?? 0}`.includes(search.toLowerCase());

    const cat = getProductCategory(p?.name);
    const matchesCategory = categoryFilter === "All" || cat === categoryFilter;

    const matchesAvailability =
      availabilityFilter === "All" ||
      (availabilityFilter === "Active" && p?.is_active) ||
      (availabilityFilter === "Inactive" && !p?.is_active);

    const matchesStock = (() => {
      const qty = p?.quantity ?? 0;
      switch (stockFilter) {
        case "In Stock":
          return qty > 10;
        case "Low Stock":
          return qty > 0 && qty <= 10;
        case "Out of Stock":
          return qty === 0;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesCategory && matchesAvailability && matchesStock;
  });

  return (
    <div className="space-y-6 text-[#FAFAFA] bg-[#09090B] animate-fade-in">
      {/* Header */}
      <SectionHeader
        title="Product Catalog Moderation"
        subtitle={`${data?.total ?? 0} active crop items moderated on the platform`}
      />

      {/* Advanced Filters Block */}
      <div className="p-5 rounded-3xl bg-[#111113] border border-[#1F1F23] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717A]" />
            <input
              type="search"
              placeholder="Search product catalog, brand names, or farmer owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 pr-4 rounded-xl border border-[#1F1F23] bg-[#161618] text-[#FAFAFA] text-sm placeholder:text-[#71717A] w-full focus:outline-none focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/10 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter selector */}
            <div className="flex items-center gap-2 bg-[#161618] border border-[#1F1F23] rounded-xl px-3 py-1.5">
              <Tag className="w-3.5 h-3.5 text-[#22C55E]" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-xs text-[#FAFAFA] font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-[#111113]">All Categories</option>
                <option value="Vegetables" className="bg-[#111113]">Vegetables</option>
                <option value="Fruits" className="bg-[#111113]">Fruits</option>
                <option value="Dairy & Eggs" className="bg-[#111113]">Dairy & Eggs</option>
                <option value="Grains & Cereals" className="bg-[#111113]">Grains & Cereals</option>
                <option value="Others" className="bg-[#111113]">Others</option>
              </select>
            </div>

            {/* Availability Filter selector */}
            <div className="flex items-center gap-2 bg-[#161618] border border-[#1F1F23] rounded-xl px-3 py-1.5">
              <Power className="w-3.5 h-3.5 text-[#3B82F6]" />
              <select
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value as any)}
                className="bg-transparent text-xs text-[#FAFAFA] font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-[#111113]">All Statuses</option>
                <option value="Active" className="bg-[#111113]">Active / Listed</option>
                <option value="Inactive" className="bg-[#111113]">Deactivated</option>
              </select>
            </div>

            {/* Stock Filter selector */}
            <div className="flex items-center gap-2 bg-[#161618] border border-[#1F1F23] rounded-xl px-3 py-1.5">
              <Box className="w-3.5 h-3.5 text-[#D4AF37]" />
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="bg-transparent text-xs text-[#FAFAFA] font-semibold focus:outline-none cursor-pointer"
              >
                <option value="All" className="bg-[#111113]">All Stock Levels</option>
                <option value="In Stock" className="bg-[#111113]">In Stock (&gt; 10)</option>
                <option value="Low Stock" className="bg-[#111113]">Low Stock (1-10)</option>
                <option value="Out of Stock" className="bg-[#111113]">Out of Stock (0)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Catalog Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <Card className="border-[#1F1F23] bg-[#111113] p-10 text-center text-[#EF4444]">
          Failed to load inventory logs. Please refresh.
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Package className="w-7 h-7 text-[#71717A]" />}
          title="No products matched filters"
          description="Adjust search string keywords or filters context."
        />
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-[#1F1F23] bg-[#111113] shadow-sm">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[#1F1F23] text-[#A1A1AA] text-xs uppercase tracking-wider font-bold">
                <th className="p-4 pl-6">Product Item</th>
                <th className="p-4">Farmer / Producer</th>
                <th className="p-4">Category</th>
                <th className="p-4">Unit Price</th>
                <th className="p-4">Available Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F23]">
              {(filtered ?? []).map((p) => {
                const category = getProductCategory(p?.name);
                const qty = p?.quantity ?? 0;
                
                // Color codes for stock levels
                const stockColor =
                  qty === 0
                    ? "text-[#EF4444]"
                    : qty <= 10
                    ? "text-[#F59E0B]"
                    : "text-[#22C55E]";

                return (
                  <tr
                    key={p?.id ?? 0}
                    className="hover:bg-[#161618] transition-colors cursor-pointer"
                    onClick={() => setSelectedProduct(p)}
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <img
                          src={getProductImage(p?.name ?? "", p?.image_url)}
                          alt={p?.name ?? "Product"}
                          className="w-10 h-10 rounded-xl object-cover border border-[#1F1F23]"
                        />
                        <div className="flex flex-col">
                          <span className="font-semibold text-[#FAFAFA]">{p?.name ?? "—"}</span>
                          <span className="text-xs text-[#71717A] max-w-[200px] truncate">{p?.description ?? ""}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-[#A1A1AA] font-medium">
                      <div className="flex flex-col">
                        <span>{p?.farmer_name || "Unknown Farmer"}</span>
                        <span className="text-[10px] text-[#71717A] font-mono mt-0.5">Owner #{p?.farmer_id ?? 0}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider bg-zinc-900 border-[#27272A] text-[#FAFAFA]">
                        {category}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-black text-[#FAFAFA]">
                      ₹{p?.price ?? 0} <span className="text-[10px] text-[#71717A] font-bold">/ {p?.unit ?? "unit"}</span>
                    </td>
                    <td className="p-4 font-mono">
                      <div className="flex flex-col">
                        <span className={`font-bold ${stockColor}`}>{qty} {p?.unit ?? "unit"}s</span>
                        <span className="text-[9px] text-[#71717A] font-bold mt-0.5 uppercase">
                          {qty === 0 ? "Out of Stock" : qty <= 10 ? "Low Supply" : "Sufficient"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge label={p?.is_active ? "active" : "inactive"} dot />
                    </td>
                    <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end">
                        <ProductActions product={p} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination controls */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-[#1F1F23] pt-4">
          <p className="text-xs text-[#71717A]">
            Showing Page {page} of {totalPages} · {data?.total ?? 0} products
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
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Product Detail Side Drawer */}
      {selectedProduct && (() => {
        const category = getProductCategory(selectedProduct?.name);
        const harvestDateText = selectedProduct?.harvest_date && !isNaN(new Date(selectedProduct.harvest_date).getTime())
          ? new Date(selectedProduct.harvest_date).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "—";

        return (
          <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40" onClick={() => setSelectedProduct(null)} />
            <div className="fixed right-0 top-0 h-full w-full sm:w-[500px] bg-[#111113] border-l border-[#1F1F23] shadow-2xl z-50 p-7 flex flex-col justify-between animate-slide-left text-sm">
              <div className="space-y-7 overflow-y-auto pr-1">
                <div className="flex items-center justify-between border-b border-[#1F1F23] pb-4">
                  <h3 className="text-lg font-bold text-[#FAFAFA]">Inventory Details</h3>
                  <button onClick={() => setSelectedProduct(null)} className="p-1 rounded-lg hover:bg-[#161618] text-[#71717A]">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Banner image or placeholder */}
                <div className="relative rounded-2xl border border-[#1F1F23] overflow-hidden bg-[#161618]">
                  <img
                    src={getProductImage(selectedProduct?.name ?? "", selectedProduct?.image_url)}
                    alt={selectedProduct?.name ?? "Product"}
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge label={selectedProduct?.is_active ? "active" : "inactive"} dot />
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h4 className="text-lg font-bold text-[#FAFAFA]">{selectedProduct?.name ?? "—"}</h4>
                  <span className="inline-block px-2 py-0.5 rounded-lg border border-[#27272A] bg-zinc-900 text-[#FAFAFA] text-[10px] font-bold uppercase tracking-wider mt-1.5">
                    {category}
                  </span>
                  <p className="text-xs text-[#A1A1AA] mt-3 leading-relaxed">{selectedProduct?.description ?? ""}</p>
                </div>

                {/* Parameters */}
                <div className="space-y-4 pt-2">
                  <h5 className="text-xs font-bold text-[#71717A] uppercase tracking-wider">Specifications</h5>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-[#D4AF37]" />
                      <div>
                        <p className="text-xs text-[#71717A] font-semibold">Harvest Date</p>
                        <p className="text-[#FAFAFA] font-medium mt-0.5">
                          {harvestDateText}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-[#22C55E]" />
                      <div>
                        <p className="text-xs text-[#71717A] font-semibold">Farmer Owner</p>
                        <p className="text-[#FAFAFA] font-medium mt-0.5">
                          {selectedProduct?.farmer_name || `Farmer Account #${selectedProduct?.farmer_id ?? 0}`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stock details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-[#161618] border border-[#1F1F23] rounded-2xl">
                    <p className="text-[10px] uppercase font-bold text-[#71717A]">Price per Unit</p>
                    <p className="font-black text-[#FAFAFA] text-base mt-0.5">₹{selectedProduct?.price ?? 0} / {selectedProduct?.unit ?? "unit"}</p>
                  </div>
                  <div className="p-3 bg-[#161618] border border-[#1F1F23] rounded-2xl">
                    <p className="text-[10px] uppercase font-bold text-[#71717A]">Listed Quantity</p>
                    <p className="font-black text-[#FAFAFA] text-base mt-0.5">{selectedProduct?.quantity ?? 0} {selectedProduct?.unit ?? "unit"}s</p>
                  </div>
                </div>
              </div>

              {/* Drawer actions */}
              <div className="border-t border-[#1F1F23] pt-4 mt-4 flex gap-3">
                <div className="flex-1 flex" onClick={(e) => e.stopPropagation()}>
                  <ProductActions product={selectedProduct} />
                </div>
                <Button variant="secondary" className="flex-1" onClick={() => setSelectedProduct(null)}>Close</Button>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
