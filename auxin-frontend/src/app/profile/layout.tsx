"use client";
/** app/profile/layout.tsx — Role-aware Profile Layout with DesktopSidebar & BottomNav */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/layout/BottomNav";
import { useAuthStore } from "@/store/authStore";
import { PageLoader } from "@/components/ui/Card";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      router.replace("/auth");
    }
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || !isAuthenticated || !user) return <PageLoader />;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      {/* Desktop Navigation Sidebar */}
      <DesktopSidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col lg:pl-[240px]">
        <main className="flex-1 pb-24 lg:pb-12">{children}</main>
      </div>

      {/* Mobile/Tablet Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
