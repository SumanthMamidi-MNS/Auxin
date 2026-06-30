/**
 * auxin-admin/src/lib/auth.ts
 * -----------------------------
 * Supabase Auth wrapper for the Auxin admin dashboard.
 *
 * Admin authentication uses the same Supabase project as the main app.
 * After sign-in, we verify the user has role=admin on our backend.
 */

import { supabase } from "@/lib/supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ---------------------------------------------------------------------------
// Sign in
// ---------------------------------------------------------------------------

export async function adminSignIn(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: unknown }> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.session) {
    return { success: false, error: "No session returned." };
  }

  // Verify admin role on our backend
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${data.session.access_token}` },
  });

  if (!res.ok) {
    await supabase.auth.signOut();
    return { success: false, error: "Account not found. Contact support." };
  }

  const me = await res.json();
  // Allow all admin sub-roles (super_admin, support_admin, operations_admin, logistics_admin, admin)
  const ADMIN_ROLES = ["admin", "super_admin", "support_admin", "operations_admin", "logistics_admin"];
  if (!ADMIN_ROLES.includes(me.role)) {
    await supabase.auth.signOut();
    return { success: false, error: "Access denied. Admin accounts only." };
  }

  return { success: true, user: me };
}

// ---------------------------------------------------------------------------
// Sign out
// ---------------------------------------------------------------------------

export async function adminSignOut(): Promise<void> {
  await supabase.auth.signOut();
}

// ---------------------------------------------------------------------------
// Get session
// ---------------------------------------------------------------------------

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// ---------------------------------------------------------------------------
// Get current admin profile
// ---------------------------------------------------------------------------

export async function getAdminMe() {
  const session = await getSession();
  if (!session) return null;

  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) return null;
  return res.json();
}
