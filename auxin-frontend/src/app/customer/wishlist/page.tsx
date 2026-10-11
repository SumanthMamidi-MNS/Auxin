"use client";
/**
 * app/customer/wishlist/page.tsx — Auxin v3.0
 * GOAT-Level Customer Wishlist Experience:
 *  - Responsive ProductGrid integration
 *  - EmptyWishlist SVG Illustration
 *  - Move-to-cart batch support
 *  - Page-content container centering
 */

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, ChevronLeft, Trash2, ArrowRight, ShoppingCart } from "lucide-react";
import { BrandHeader } from "@/components/layout/TopBar";
import { CartAwareProductCard } from "@/components/features/ProductCard";
import { ProductGrid } from "@/components/features/ProductGrid";
import { EmptyState } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyWishlistIllustration } from "@/components/illustrations/EmptyWishlist";
import { HomeSkeleton } from "@/components/ui/Skeletons";
import { catalogueApi } from "@/lib/catalogue";
import { useAuthStore } from "@/store/authStore";
import { useCartStore } from "@/store/cartStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function WishlistPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);

  const getWishlistKey = () => `auxin_wishlist_${user?.id || "guest"}`;

  // Load wishlist on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(getWishlistKey());
      if (saved) {
        try {
          setWishlistIds(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [user?.id]);

  // Fetch all catalogue products to match wishlisted items
  const { data, isLoading } = useQuery({
    queryKey: ["catalogue-wishlist"],
    queryFn: () => catalogueApi.list({ page: 1, page_size: 100 }).then((r) => r.data),
    staleTime: 30_000,
  });

  const allProducts = data?.items ?? [];
  const wishlistedProducts = allProducts.filter((p) => wishlistIds.includes(p.id));

  const handleClearWishlist = () => {
    localStorage.setItem(getWishlistKey(), "[]");
    setWishlistIds([]);
    toast.success("Wishlist cleared!", { icon: "🤍" });
  };

  const handleMoveAllToCart = () => {
    let added = 0;
    wishlistedProducts.forEach((p) => {
      if (!("min_price" in p)) {
        addItem(p, 1);
        added++;
      }
    });
    if (added > 0) {
      toast.success(`Added ${added} items to cart! 🛒`);
    } else {
      toast("Click individual items to pick your preferred farmer.", { icon: "ℹ️" });
    }
  };

  return (
    <div className="min-h-screen pb-32" style={{ background: "var(--bg)" }}>
      <BrandHeader />

      <div className="page-content py-4 sm:py-6 space-y-6">
        {/* Header Title Bar */}
        <div className="flex items-center justify-between p-5 rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              aria-label="Go back"
              className="w-10 h-10 rounded-2xl flex items-center justify-center border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--primary)] transition-all shadow-xs"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]" style={{ fontFamily: "var(--font-heading)" }}>
                Saved Favorites ❤️
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">
                {wishlistedProducts.length} {wishlistedProducts.length === 1 ? "item" : "items"} saved
              </p>
            </div>
          </div>

          {wishlistIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearWishlist}
                icon={<Trash2 className="w-3.5 h-3.5 text-[var(--danger)]" />}
              >
                Clear
              </Button>
            </div>
          )}
        </div>

        {/* Wishlist Items Content */}
        {isLoading ? (
          <HomeSkeleton />
        ) : wishlistIds.length === 0 ? (
          <div className="py-12">
            <EmptyState
              illustration={<EmptyWishlistIllustration className="w-24 h-24" />}
              title="Your Wishlist is Empty"
              description="Save fresh farm harvests you love by tapping the heart icon on any product."
              action={
                <Button onClick={() => router.push("/customer/home")} iconRight={<ArrowRight className="w-4 h-4" />}>
                  Browse Fresh Produce
                </Button>
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            <ProductGrid columns={4}>
              {wishlistedProducts.map((p) => (
                <CartAwareProductCard key={p.id} product={p} viewMode="grid" />
              ))}
            </ProductGrid>
          </div>
        )}
      </div>
    </div>
  );
}
