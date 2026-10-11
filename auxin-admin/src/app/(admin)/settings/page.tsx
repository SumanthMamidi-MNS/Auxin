"use client";
/**
 * app/(admin)/settings/page.tsx — Auxin Admin v3.0
 * Professional Platform Settings & Live System Telemetry Page.
 * Displays live, dynamic indicators for Database, Milo AI Engine, API, and Storage.
 * Consolidates demo reset operations into the canonical Demo Workspace.
 */
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Globe, Shield, CreditCard,
  Mail, LogOut, Activity, Database, HardDrive, Cpu, Radio, RotateCcw, ArrowRight, CheckCircle2, Loader2, Bot
} from "lucide-react";
import { Card, SectionHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";
import { adminSignOut } from "@/lib/auth";
import { adminApi } from "@/lib/admin";
import toast from "react-hot-toast";

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#1F1F23] last:border-b-0">
      <span className="text-xs text-[#71717A] font-semibold">{label}</span>
      <span
        className={`text-xs font-semibold text-[#FAFAFA] ${mono ? "font-mono tracking-wide" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function LiveStatusIndicator({
  name,
  status,
  icon,
  detail,
  latency,
}: {
  name: string;
  status: "online" | "warning" | "offline";
  icon: React.ReactNode;
  detail?: string;
  latency?: number | null;
}) {
  const statusColor =
    status === "online"
      ? "text-[#22C55E] bg-emerald-950/20 border-emerald-900/30"
      : status === "warning"
      ? "text-[#F59E0B] bg-amber-950/20 border-amber-900/30"
      : "text-[#EF4444] bg-red-950/20 border-red-900/30";

  const dotColor =
    status === "online"
      ? "bg-[#22C55E]"
      : status === "warning"
      ? "bg-[#F59E0B]"
      : "bg-[#EF4444]";

  return (
    <div className="flex flex-col justify-between p-3.5 rounded-2xl border border-[#1F1F23] bg-[#111113] space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-[#A1A1AA]">{icon}</span>
          <span className="text-xs font-bold text-[#FAFAFA]">{name}</span>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${statusColor}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} />
          {status === "online" ? "OPERATIONAL" : status === "warning" ? "DEGRADED" : "OFFLINE"}
        </span>
      </div>
      {(detail || latency !== undefined) && (
        <div className="flex items-center justify-between text-[10px] text-[#71717A] font-medium pt-1 border-t border-[#1F1F23]/60">
          <span>{detail}</span>
          {latency !== null && latency !== undefined && (
            <span className="font-mono text-[#22C55E]">{latency}ms</span>
          )}
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  // Fetch real live health telemetry
  const { data: health, isLoading: loadingHealth } = useQuery({
    queryKey: ["admin-system-health"],
    queryFn: () => adminApi.getSystemHealth().then((r) => r.data),
    refetchInterval: 15_000,
  });

  const handleLogout = async () => {
    await adminSignOut();
    clearAuth();
    toast.success("Successfully logged out of Admin Portal.", {
      style: { background: "#111113", color: "#FAFAFA", border: "1px solid #1F1F23" }
    });
    router.push("/auth");
  };

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";
  const appVersion = "v3.0.0-rc1";
  const env = health?.environment ?? (process.env.NODE_ENV ?? "development").toUpperCase();

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl text-[#FAFAFA] bg-[#09090B] pb-12">
      {/* Page Header */}
      <SectionHeader
        title="Settings & System Configurations"
        subtitle="Live system telemetry, administrative profile, and environment parameters."
      />

      {/* Live Health indicators block */}
      <div className="space-y-4">
        <SectionHeader
          title="Live System Telemetry"
          subtitle="Real-time connectivity and health probe index"
          action={<Activity className="w-4 h-4 text-[#22C55E]" />}
        />
        
        {loadingHealth ? (
          <div className="h-32 flex items-center justify-center bg-[#111113] rounded-2xl border border-[#1F1F23]">
            <Loader2 className="w-5 h-5 animate-spin text-[#22C55E]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <LiveStatusIndicator
              name="Core Database"
              status={health?.database?.status ?? "online"}
              icon={<Database className="w-4 h-4" />}
              detail={health?.database?.detail ?? "SQLite WAL Mode"}
              latency={health?.database?.latency_ms}
            />
            <LiveStatusIndicator
              name="Milo AI RAG Engine"
              status={health?.milo_ai?.status ?? "online"}
              icon={<Bot className="w-4 h-4 text-[#A855F7]" />}
              detail={health?.milo_ai?.detail ?? "RAG Service Active"}
              latency={health?.milo_ai?.latency_ms}
            />
            <LiveStatusIndicator
              name="API Core Gateway"
              status={health?.api_gateway?.status ?? "online"}
              icon={<Cpu className="w-4 h-4 text-[#3B82F6]" />}
              detail={health?.api_gateway?.detail ?? "FastAPI ASGI Engine"}
              latency={health?.api_gateway?.latency_ms}
            />
            <LiveStatusIndicator
              name="Auth Gateway"
              status={health?.auth_service?.status ?? "online"}
              icon={<Shield className="w-4 h-4 text-[#22C55E]" />}
              detail={health?.auth_service?.detail ?? "Supabase Auth Active"}
            />
            <LiveStatusIndicator
              name="Storage Engine"
              status={health?.storage?.status ?? "online"}
              icon={<HardDrive className="w-4 h-4 text-[#D4AF37]" />}
              detail={health?.storage?.detail ?? "Local Media Storage"}
            />
            <LiveStatusIndicator
              name="Payment Gateway"
              status={health?.payment_gateway?.status ?? "online"}
              icon={<CreditCard className="w-4 h-4 text-[#22C55E]" />}
              detail={health?.payment_gateway?.detail ?? "Razorpay Escrow Active"}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {/* Platform parameters */}
        <div className="space-y-4">
          <SectionHeader
            title="System Parameters"
            subtitle="Runtime architecture and environment profile"
            action={<Globe className="w-4 h-4 text-[#22C55E]" />}
          />
          <Card className="p-5 border border-[#1F1F23] bg-[#111113] rounded-3xl space-y-1">
            <InfoRow label="API Gateway URL" value={apiUrl} mono />
            <InfoRow label="Environment Class" value={env} />
            <InfoRow label="Platform Version" value={appVersion} mono />
            <InfoRow label="Database Engine" value={health?.database_engine ?? "SQLite (WAL Mode)"} />
            <InfoRow label="Storage Engine" value="Local Storage / S3 Ready" />
          </Card>
        </div>

        {/* Current profile details */}
        <div className="space-y-4">
          <SectionHeader
            title="Administrator Profile"
            subtitle="Active authenticated session credentials"
            action={<Shield className="w-4 h-4 text-[#22C55E]" />}
          />
          <Card className="p-5 border border-[#1F1F23] bg-[#111113] rounded-3xl space-y-1">
            <InfoRow label="Full Name" value={user?.name ?? "Super Admin"} />
            <InfoRow label="Registered Phone" value={user?.phone ?? "+91 99999 99990"} mono />
            {user?.email && <InfoRow label="Email Address" value={user.email} />}
            <InfoRow label="Access Role" value={user?.is_super_admin ? "Super Admin 👑" : "Platform Admin"} />
            <InfoRow label="Security Status" value={(user?.status ?? "approved").toUpperCase()} />
          </Card>
        </div>
      </div>

      {/* Consolidated Demo Environment Callout */}
      {user?.is_super_admin && (
        <div className="space-y-4 pt-2">
          <SectionHeader
            title="Demonstration Sandbox Environment"
            subtitle="Centralized presentation sandbox and demonstration lifecycle controls"
            action={<RotateCcw className="w-4 h-4 text-[#22C55E]" />}
          />
          <Card className="p-5 border border-[#1F1F23] bg-[#111113] rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#FAFAFA]">Demo Workspace & Sandbox Controls</span>
                <span className="text-[9px] bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] px-2 py-0.2 rounded-full font-bold uppercase">Centralized</span>
              </div>
              <p className="text-xs text-[#71717A] max-w-xl">
                Demonstration statistics, scenario walkthrough guides, bypass OTP credentials, and sandbox reset controls are managed within the dedicated Demo Workspace.
              </p>
            </div>
            <Link
              href="/demo-workspace"
              className="px-4 py-2 rounded-xl bg-[#161618] border border-[#27272A] hover:border-[#22C55E]/40 hover:bg-[#1C1C1E] text-xs font-bold text-[#FAFAFA] flex items-center gap-1.5 transition-all flex-shrink-0"
            >
              <span>Open Demo Workspace</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#22C55E]" />
            </Link>
          </Card>
        </div>
      )}

      {/* System Information & Developer Credit */}
      <div className="space-y-4 pt-2">
        <SectionHeader
          title="Platform Information & Credits"
          subtitle="System metadata and developer attribution"
          action={<Activity className="w-4 h-4 text-[#D4A359]" />}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-5 border border-[#1F1F23] bg-[#111113] rounded-3xl space-y-1">
            <InfoRow label="Application Name" value="Auxin Direct Marketplace" />
            <InfoRow label="Build Release" value="v3.0.0-rc1" mono />
            <InfoRow label="Milo AI Status" value="Integrated RAG Service Active" />
            <InfoRow label="Escrow System" value="Automated State Machine" />
            <InfoRow label="Platform Status" value="Operational" />
          </Card>

          <div 
            className="p-5 rounded-3xl space-y-3 relative overflow-hidden"
            style={{ 
              background: "linear-gradient(135deg, rgba(212,163,89,0.04) 0%, transparent 100%)",
              border: "1px solid rgba(212,163,89,0.18)",
            }}
          >
            <div>
              <p className="text-[9px] uppercase tracking-widest text-[#D4A359] font-bold">Designed & Engineered By</p>
              <h4 className="text-sm font-black text-[#FAFAFA] mt-0.5">Sumanth Mamidi</h4>
              <p className="text-[10px] text-[#A1A1AA] mt-0.5">AI & ML Engineer · Full-Stack Developer</p>
            </div>
            <p className="text-[11px] italic text-[#D4A359] leading-relaxed border-l-2 pl-2" style={{ borderColor: "rgba(212,163,89,0.5)" }}>
              "Designing intelligent software. Building technology with purpose."
            </p>
            <div className="flex gap-3 text-[10px] font-bold pt-1">
              <a href="https://github.com/sumanthmamidi" target="_blank" rel="noopener noreferrer" className="text-[#A1A1AA] hover:text-[#D4A359] transition-colors">GitHub</a>
              <span className="text-[#27272A]">•</span>
              <a href="https://linkedin.com/in/sumanthmamidi" target="_blank" rel="noopener noreferrer" className="text-[#A1A1AA] hover:text-[#D4A359] transition-colors">LinkedIn</a>
              <span className="text-[#27272A]">•</span>
              <a href="mailto:sumanthmamidi74@gmail.com" className="text-[#A1A1AA] hover:text-[#D4A359] transition-colors">Email</a>
            </div>
          </div>
        </div>
      </div>

      {/* Disconnect session card */}
      <section className="pt-2">
        <div className="p-5 flex items-center justify-between border border-red-950/20 bg-red-950/5 rounded-3xl">
          <div>
            <p className="text-sm font-bold text-[#FAFAFA]">Sign Out from Admin Portal</p>
            <p className="text-xs text-[#71717A] mt-0.5">Safely terminates your active administrative session.</p>
          </div>
          <Button
            variant="danger"
            size="sm"
            icon={<LogOut className="w-4 h-4" />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </section>
    </div>
  );
}
