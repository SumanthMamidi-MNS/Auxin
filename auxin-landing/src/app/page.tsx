/**
 * auxin-landing/src/app/page.tsx
 * Auxin marketing landing page — auxin.in / auxin.com
 *
 * Structure:
 *   1. Nav bar
 *   2. Hero section   (cinematic, full-viewport)
 *   3. How it works   (3-step)
 *   4. Trust section  (escrow, verified farmers, fresh guarantee)
 *   5. CTA            (launch app)
 *   6. Footer
 *
 * Zero external dependencies — pure HTML + inline styles + CSS vars.
 * When design is finalized, migrate to Tailwind.
 */

import "./globals.css";

const APP_URL   = process.env.NEXT_PUBLIC_APP_URL   ?? "https://app.auxin.in";
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.auxin.in";

// ── Primitive style helpers (avoids repeating long style objects) ─────────────

const s = {
  // Layout
  flex:         { display: "flex" },
  flexCol:      { display: "flex", flexDirection: "column" as const },
  center:       { display: "flex", alignItems: "center", justifyContent: "center" },
  between:      { display: "flex", alignItems: "center", justifyContent: "space-between" },
  // Section container
  section:      { maxWidth: 1100, margin: "0 auto", padding: "0 20px" },
} as const;

// ── Color palette ─────────────────────────────────────────────────────────────

const C = {
  green:   "#1B5E20",
  greenL:  "#2E7D32",
  gold:    "#C9A227",
  ivory:   "#FAF9F6",
  white:   "#FFFFFF",
  charcoal:"#1C1C1C",
  muted:   "#6B7280",
  greenBg: "#F1F8F2",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function NavBar() {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: "rgba(250,249,246,0.92)", backdropFilter: "blur(12px)",
      borderBottom: "1px solid #e8f5e9",
    }}>
      <div style={{ ...s.between, ...s.section, height: 64 }}>
        {/* Logo */}
        <div style={{ ...s.flex, alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: C.green, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "white", fontWeight: 900, fontSize: 18 }}>A</span>
          </div>
          <span style={{ fontWeight: 900, fontSize: 20, color: C.green }}>Auxin</span>
        </div>

        {/* CTA */}
        <a
          href={APP_URL}
          style={{
            background: C.green, color: "white",
            padding: "8px 20px", borderRadius: 10, textDecoration: "none",
            fontWeight: 700, fontSize: 14,
            transition: "background 0.2s",
          }}
        >
          Open App →
        </a>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section style={{
      minHeight: "calc(100vh - 64px)",
      background: `linear-gradient(135deg, ${C.green} 0%, #2E7D32 40%, #1B5E20 100%)`,
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      textAlign: "center", padding: "80px 20px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Background texture */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "radial-gradient(circle at 20% 80%, rgba(201,162,39,0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%)",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
        {/* Trust badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "rgba(201,162,39,0.15)", border: "1px solid rgba(201,162,39,0.35)",
          borderRadius: 100, padding: "6px 16px", marginBottom: 28,
        }}>
          <span style={{ fontSize: 14 }}>🌾</span>
          <span style={{ color: C.gold, fontWeight: 600, fontSize: 13 }}>
            100% Farmer-Direct · Verified Sellers
          </span>
        </div>

        {/* Headline */}
        <h1 style={{
          color: "white", fontWeight: 900,
          fontSize: "clamp(2.5rem, 7vw, 4.5rem)",
          lineHeight: 1.1, margin: "0 0 24px",
          letterSpacing: "-0.02em",
        }}>
          Fresh from the farm.{" "}
          <span style={{ color: C.gold }}>Straight to you.</span>
        </h1>

        {/* Sub-headline */}
        <p style={{
          color: "rgba(255,255,255,0.75)", fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
          maxWidth: 560, margin: "0 auto 40px", lineHeight: 1.7,
        }}>
          Buy directly from verified Indian farmers. No middlemen.
          Fair prices. Produce harvested fresh and delivered within 24 hours.
        </p>

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href={APP_URL}
            style={{
              background: C.gold, color: "#1a1a1a",
              padding: "14px 32px", borderRadius: 14, textDecoration: "none",
              fontWeight: 800, fontSize: 16,
              boxShadow: "0 8px 30px rgba(201,162,39,0.4)",
              transition: "transform 0.2s",
              display: "inline-block",
            }}
          >
            Shop Fresh Produce →
          </a>
          <a
            href={`${APP_URL}/auth`}
            style={{
              background: "rgba(255,255,255,0.12)", color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
              padding: "14px 32px", borderRadius: 14, textDecoration: "none",
              fontWeight: 700, fontSize: 16,
              display: "inline-block",
            }}
          >
            Sell as Farmer
          </a>
        </div>

        {/* Social proof */}
        <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, marginTop: 32 }}>
          Escrow-protected payments · Real-time delivery tracking · Admin-verified farmers
        </p>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      icon: "🛒", step: "01",
      title: "Browse & Order",
      desc: "Discover fresh seasonal produce from verified farmers near you. See harvest dates, farm details, and honest prices.",
    },
    {
      icon: "🔒", step: "02",
      title: "Escrow Payment",
      desc: "Pay securely via Razorpay. Your money is held in escrow — released to the farmer only after you confirm delivery.",
    },
    {
      icon: "🚴", step: "03",
      title: "Fast Delivery",
      desc: "Tracked delivery with OTP confirmation. Get farm-fresh produce in 24 hours. If anything's wrong, instant dispute resolution.",
    },
  ];

  return (
    <section style={{ padding: "96px 20px", background: C.white }}>
      <div style={s.section}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span style={{ color: C.gold, fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            How Auxin Works
          </span>
          <h2 style={{ color: C.charcoal, fontWeight: 900, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", margin: "12px 0 16px", letterSpacing: "-0.02em" }}>
            From field to your table
          </h2>
          <p style={{ color: C.muted, fontSize: 16, maxWidth: 480, margin: "0 auto" }}>
            The entire journey is transparent, secure, and tracked.
          </p>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 24,
        }}>
          {steps.map((s, i) => (
            <div key={i} style={{
              background: C.ivory, borderRadius: 20, padding: "32px 28px",
              border: "1px solid #e8f5e9",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 16, right: 20,
                fontSize: 56, fontWeight: 900, color: "#e8f5e9",
                lineHeight: 1, userSelect: "none",
              }}>
                {s.step}
              </div>
              <div style={{ fontSize: 36, marginBottom: 16 }}>{s.icon}</div>
              <h3 style={{ color: C.charcoal, fontWeight: 800, fontSize: 18, margin: "0 0 10px" }}>
                {s.title}
              </h3>
              <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, margin: 0 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustSection() {
  const items = [
    { icon: "✅", title: "Admin-Verified Farmers",   desc: "Every seller is reviewed and approved by our team before listing." },
    { icon: "🔒", title: "Escrow Protection",        desc: "Payment released only after delivery confirmation. Zero risk." },
    { icon: "🌿", title: "Harvest Freshness",        desc: "Harvest dates shown on every product. No stored produce sold as fresh." },
    { icon: "⚡",  title: "24-Hour Delivery",        desc: "Hyperlocal dispatch network. Farm-fresh in under a day." },
    { icon: "🛡️", title: "Dispute Resolution",       desc: "Raise a dispute anytime. Refunds processed within 48 hours." },
    { icon: "📱", title: "Mobile-First Design",      desc: "Works beautifully on any device. No app download required." },
  ];

  return (
    <section style={{ padding: "96px 20px", background: C.greenBg }}>
      <div style={s.section}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span style={{ color: C.gold, fontWeight: 700, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Why Trust Auxin
          </span>
          <h2 style={{ color: C.charcoal, fontWeight: 900, fontSize: "clamp(1.75rem, 4vw, 2.5rem)", margin: "12px 0", letterSpacing: "-0.02em" }}>
            Built for trust, built for India
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
        }}>
          {items.map((item, i) => (
            <div key={i} style={{
              background: C.white, borderRadius: 16, padding: "24px 22px",
              border: "1px solid #e8f5e9",
              display: "flex", gap: 14, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
              <div>
                <p style={{ fontWeight: 700, color: C.charcoal, margin: "0 0 4px", fontSize: 15 }}>
                  {item.title}
                </p>
                <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section style={{
      padding: "96px 20px",
      background: `linear-gradient(135deg, ${C.green} 0%, #2E7D32 100%)`,
      textAlign: "center",
    }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h2 style={{
          color: "white", fontWeight: 900,
          fontSize: "clamp(1.75rem, 4vw, 3rem)",
          margin: "0 0 16px", letterSpacing: "-0.02em",
        }}>
          Ready to eat fresh?
        </h2>
        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, marginBottom: 40 }}>
          Join thousands of families buying direct from Indian farmers.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href={APP_URL}
            style={{
              background: C.gold, color: "#1a1a1a",
              padding: "16px 36px", borderRadius: 14, textDecoration: "none",
              fontWeight: 800, fontSize: 17,
              boxShadow: "0 8px 30px rgba(201,162,39,0.4)",
              display: "inline-block",
            }}
          >
            Start Shopping →
          </a>
          <a
            href={`${APP_URL}/auth`}
            style={{
              background: "transparent", color: "white",
              border: "2px solid rgba(255,255,255,0.4)",
              padding: "16px 36px", borderRadius: 14, textDecoration: "none",
              fontWeight: 700, fontSize: 17, display: "inline-block",
            }}
          >
            Register as Farmer
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{
      background: C.charcoal, color: "rgba(255,255,255,0.55)",
      padding: "40px 20px",
    }}>
      <div style={{ ...s.between, ...s.section, flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: C.green, display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "white", fontWeight: 900, fontSize: 14 }}>A</span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.8)", fontWeight: 700 }}>Auxin</span>
        </div>

        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <a href={APP_URL}              style={{ color: "inherit", textDecoration: "none", fontSize: 14 }}>App</a>
          <a href={`${APP_URL}/auth`}    style={{ color: "inherit", textDecoration: "none", fontSize: 14 }}>Sign Up</a>
          <a href="mailto:hello@auxin.in" style={{ color: "inherit", textDecoration: "none", fontSize: 14 }}>Contact</a>
        </div>

        <p style={{ fontSize: 13, margin: 0 }}>
          © {new Date().getFullYear()} Auxin. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <NavBar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <TrustSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
