/**
 * types/index.ts â€” Auxin Admin shared types
 * All domain models shared between admin UI and backend.
 */

// â”€â”€ Admin Role System â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type AdminRole =
  | "admin"          // legacy â€” treated as super_admin
  | "super_admin"    // full access
  | "support_admin"  // disputes + orders + users (read)
  | "operations_admin" // orders + farmers + products
  | "logistics_admin"; // deliveries + orders

export type UserRole = "customer" | "farmer" | "delivery" | AdminRole;

export function isAdminRole(role: string): role is AdminRole {
  return [
    "admin", "super_admin", "support_admin",
    "operations_admin", "logistics_admin",
  ].includes(role);
}

// â”€â”€ RBAC Permission System â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type Permission =
  | "manage_orders"
  | "manage_products"
  | "manage_farmers"
  | "manage_delivery"
  | "manage_users"
  | "manage_finances"
  | "manage_disputes"
  | "view_analytics";   // super only

/** Role â†’ permissions mapping */
const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  admin: [
    "manage_orders", "manage_products", "manage_farmers", "manage_delivery",
    "manage_users", "manage_finances", "manage_disputes", "view_analytics",
  ],
  super_admin: [
    "manage_orders", "manage_products", "manage_farmers", "manage_delivery",
    "manage_users", "manage_finances", "manage_disputes", "view_analytics",
  ],
  support_admin: [
    "manage_orders", "manage_disputes", "manage_users",
  ],
  operations_admin: [
    "manage_orders", "manage_products", "manage_farmers",
  ],
  logistics_admin: [
    "manage_orders", "manage_delivery",
  ],
};

/** Returns the set of permissions for a given admin role */
export function getPermissions(role: AdminRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/** Returns true if the role has the requested permission */
export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return getPermissions(role).includes(permission);
}

/** Human-readable label for admin sub-role */
export function adminRoleLabel(role: string): string {
  const map: Record<string, string> = {
    admin:             "Super Admin",
    super_admin:       "Super Admin",
    support_admin:     "Support",
    operations_admin:  "Operations",
    logistics_admin:   "Logistics",
  };
  return map[role] ?? "Admin";
}

// â”€â”€ User â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

/**
 * User account lifecycle status.
 *
 * - pending   Registered but awaiting admin approval (farmer/delivery only)
 * - approved  Active and permitted to use the platform
 * - rejected  Approval was denied; login is blocked
 * - suspended Admin-suspended; login is blocked
 */
export type UserStatus = "pending" | "approved" | "rejected" | "suspended";

export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

// â”€â”€ Farmer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface Farmer {
  id: number;
  user_id: number;
  full_name: string;
  phone: string;
  location: string;
  ifsc_code: string;
  is_approved: boolean;
  created_at: string;
}

// â”€â”€ Product â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface Product {
  id: number;
  farmer_id: number;
  farmer_name?: string;
  name: string;
  description: string;
  price: number;
  /** Available stock — maps to the `quantity` column in the DB (renamed from `stock` in migration 004) */
  quantity: number;
  unit: string;
  harvest_date: string;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
}

// â”€â”€ Order â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type OrderStatus =
  | "pending" | "accepted" | "rejected" | "cancelled" | "completed";

export interface OrderItem {
  id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  price_at_order_time: number;
  subtotal: number;
}

export interface Order {
  id: number;
  customer_id: number;
  farmer_id: number;
  farmer_name?: string;
  total_amount: number;
  status: OrderStatus;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

// â”€â”€ Delivery â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export type DeliveryStatus =
  | "assigned" | "picked_up" | "out_for_delivery" | "delivered" | "failed";

export interface Delivery {
  id: number;
  order_id: number;
  partner_id: number;
  status: DeliveryStatus;
  otp_code?: string;
  estimated_delivery?: string;
  actual_delivery?: string;
  created_at: string;
}

// ── Payment ──────────────────────────────────────────────────────────────────

export type PaymentStatus = "created" | "paid" | "failed" | "refunded";

export interface Payment {
  id: number;
  order_id: number;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

// ── Dispute ───────────────────────────────────────────────────────────────────

export type DisputeStatus = "open" | "in_review" | "resolved" | "rejected";

export interface Dispute {
  id: number;
  order_id: number;
  raised_by: number;
  reason: string;
  status: DisputeStatus;
  resolution_note?: string | null;
  created_at: string;
  updated_at: string;
}

// â”€â”€ Generic API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// â”€â”€ Admin Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export interface AdminStats {
  total_users: number;
  total_orders: number;
  total_products: number;
  total_disputes: number;
  pending_farmers: number;
  open_disputes: number;
  total_revenue: number;
}

// â”€â”€ CMS Scaffold (future â€” not implemented yet) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// These interfaces define the shape of CMS features planned for future phases.
// No UI or API calls are wired yet â€” this is architecture preparation only.

export interface CmsBanner {
  id: number;
  title: string;
  subtitle?: string;
  image_url?: string;
  cta_label?: string;
  cta_url?: string;
  is_active: boolean;
  position: "home_top" | "home_mid" | "category";
  created_at: string;
}

export interface CmsAnnouncement {
  id: number;
  message: string;
  type: "info" | "warning" | "success";
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

export interface BusinessRule {
  key: string;
  value: string;
  description: string;
  editable_by: AdminRole[];
}

