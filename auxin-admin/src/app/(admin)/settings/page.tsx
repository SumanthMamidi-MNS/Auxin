"use client";
/**
 * app/(admin)/settings/page.tsx — Auxin Admin v2.0
 * Platform settings: API info, environment details, planned features.
 */

import {
  Globe, Server, Code2, Shield, Bell, CreditCard,
  BarChart2, Webhook, Mail, FileText, Lock, Layers,
} from "lucide-react";
import { Card, SectionHeader } from "@/components/ui/Card";
import { useAuthStore } from "@/store/authStore";
import { adminRoleLabel, type AdminRole } from "@/types";

/* ── Info row ───────────────────────────────────────────────────────────── */
function InfoRow({
  label, value, mono = false,
}: {
  label: string; value: string; mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#27272A] last:border-b-0">
      <span className="text-sm text-[#71717A]">{label}</span>
      <span
        className={`text-sm font-semibold text-[#F4F4F5] ${mono ? "font-mono text-xs tracking-wide" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

/* ── Coming soon feature card ───────────────────────────────────────────── */
function PlannedFeature({
  icon: Icon, title, description,
}: {
  icon: React.ElementType; title: string; description: string;
}) {
  return (
    <div
      className="flex gap-3 p-4 rounded-xl border border-[#27272A] transition-all duration-150 hover:border-[#3F3F46] group"
      style={{ background: "rgba(255,255,255,0.01)" }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(161,161,170,0.08)" }}
      >
        <Icon className="w-4 h-4 text-[#52525B] group-hover:text-[#71717A] transition-colors" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-[#A1A1AA]">{title}</p>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(161,161,170,0.1)", color: "#52525B" }}
          >
            Soon
          </span>
        </div>
        <p className="text-xs text-[#52525B] mt-0.5 line-clamp-2">{description}</p>
      </div>
    </div>
  );
}

const PLANNED_FEATURES = [
  { icon: Bell,      title: "Push Notifications",    description: "Real-time alerts for new orders and disputes via Supabase Realtime." },
  { icon: CreditCard,title: "Payments Dashboard",    description: "Full payment ledger, refund management, and payout tracking." },
  { icon: BarChart2, title: "Advanced Analytics",    description: "Revenue charts, cohort analysis, and farmer performance metrics." },
  { icon: Webhook,   title: "Webhook Integrations",  description: "Outbound webhooks for order events and delivery status updates." },
  { icon: Mail,      title: "Email Campaigns",       description: "Broadcast announcements and marketing emails to user segments." },
  { icon: FileText,  title: "Audit Log Viewer",      description: "Full chronological log of all admin actions with user attribution." },
  { icon: Lock,      title: "Two-Factor Auth",       description: "TOTP-based 2FA for admin accounts with backup codes." },
  { icon: Layers,    title: "CMS Banners",           description: "Manage homepage banners and announcements from the admin panel." },
];

/* ── Main Page ──────────────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { user } = useAuthStore();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "https://api.auxin.farm";
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION ?? "2.0.0";
  const env = process.env.NEXT_PUBLIC_ENV ?? process.env.NODE_ENV ?? "production";

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl">
      {/* ── Platform Information ─────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Platform Information"
          subtitle="Runtime configuration and environment details"
          action={<Globe className="w-4 h-4 text-[#22C55E]" />}
        />
        <Card>
          <InfoRow label="API Endpoint" value={apiUrl} mono />
          <InfoRow label="Environment" value={env.toUpperCase()} />
          <InfoRow label="App Version" value={`v${appVersion}`} mono />
          <InfoRow label="Admin Portal" value="Auxin Admin v2.0" />
        </Card>
      </section>

      {/* ── Session Information ──────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Your Session"
          subtitle="Current admin account information"
          action={<Shield className="w-4 h-4 text-[#22C55E]" />}
        />
        <Card>
          <InfoRow label="Name" value={user?.name ?? "—"} />
          <InfoRow label="Phone" value={user?.phone ?? "—"} mono />
          {user?.email && <InfoRow label="Email" value={user.email} />}
          <InfoRow label="Role" value={adminRoleLabel(user?.role as AdminRole ?? "admin")} />
          <InfoRow label="Account ID" value={user ? `#${user.id}` : "—"} mono />
          <InfoRow label="Status" value={(user?.status ?? "active").toUpperCase()} />
        </Card>
      </section>

      {/* ── Backend Info ─────────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Backend Services"
          subtitle="Infrastructure and services powering Auxin"
          action={<Server className="w-4 h-4 text-[#22C55E]" />}
        />
        <Card>
          <InfoRow label="Auth Provider" value="Supabase Auth" />
          <InfoRow label="Database" value="PostgreSQL (Supabase)" />
          <InfoRow label="Storage" value="Supabase Storage" />
          <InfoRow label="API Framework" value="FastAPI (Python)" />
          <InfoRow label="Frontend Framework" value="Next.js 15 (App Router)" />
          <InfoRow label="State Management" value="Zustand + TanStack Query" />
        </Card>
      </section>

      {/* ── Planned Features ─────────────────────────────────────────── */}
      <section>
        <SectionHeader
          title="Planned Features"
          subtitle="Features in development for future releases"
          action={<Code2 className="w-4 h-4 text-[#52525B]" />}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PLANNED_FEATURES.map((f) => (
            <PlannedFeature key={f.title} {...f} />
          ))}
        </div>

        {/* Footer note */}
        <p className="mt-4 text-xs text-[#52525B] text-center">
          Auxin Admin v2.0 — Built with ♥ by the Anti Gravity team. All rights reserved.
        </p>
      </section>
    </div>
  );
}
