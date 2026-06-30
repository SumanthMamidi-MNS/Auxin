// ── API & Domain types for Auxin ────────────────────────────────────────

/**
 * User account lifecycle status.
 *
 * - pending   Registered but awaiting admin approval (farmer/delivery only)
 * - approved  Active and permitted to use the platform
 * - rejected  Approval was denied; login is blocked
 * - suspended Admin-suspended; login is blocked
 */
export type UserStatus = "pending" | "approved" | "rejected" | "suspended";

/**
 * All admin-tier roles share the same portal access.
 * "admin" is the primary role; sub-roles are additional access levels.
 */
export type AdminRole =
  | "admin"
  | "super_admin"
  | "support_admin"
  | "operations_admin"
  | "logistics_admin";

export type UserRole = "customer" | "farmer" | "delivery" | AdminRole;

/** Returns true for any admin-tier role */
export function isAdminRole(role: string): role is AdminRole {
  return [
    "admin",
    "super_admin",
    "support_admin",
    "operations_admin",
    "logistics_admin",
  ].includes(role);
}

export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
}

// ── Farmer ──────────────────────────────────────────────────────────────

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

// ── Product ──────────────────────────────────────────────────────────────

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

// ── Order ──────────────────────────────────────────────────────────────

export type OrderStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "completed";

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

// ── Delivery ──────────────────────────────────────────────────────────

export type DeliveryStatus =
  | "assigned"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "failed";

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

// ── Payment ──────────────────────────────────────────────────────────

export type PaymentStatus = "created" | "paid" | "failed" | "refunded";

export interface Payment {
  id: number;
  order_id: number;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  created_at: string;
}

// ── Dispute ──────────────────────────────────────────────────────────

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

// ── Generic API ──────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ApiError {
  success: false;
  error: string;
  code: string;
  request_id?: string;
}

// ── Cart (local state) ──────────────────────────────────────────────

export interface CartItem {
  product: Product;
  quantity: number;
}
