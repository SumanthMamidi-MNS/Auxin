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

export interface Address {
  id: number;
  user_id: number;
  house_flat: string;
  building?: string | null;
  street: string;
  area: string;
  landmark?: string | null;
  city: string;
  state: string;
  pin_code: string;
  address_type: string;
  is_default: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export interface User {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  role: UserRole;
  status: UserStatus;
  is_demo?: boolean;
  created_at: string;
  addresses?: Address[];
  approved_by?: string | null;
  approved_at?: string | null;
  rejected_at?: string | null;
  rejection_reason?: string | null;
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
  bank_name?: string | null;
  account_holder_name?: string | null;
  bank_account_number?: string | null;
  upi_id?: string | null;
  farm_name?: string | null;
  farm_category?: string | null;
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
  | "reserved"
  | "payment_pending"
  | "payment_confirmed"
  | "accepted"
  | "packing"
  | "ready_for_pickup"
  | "picked_up"
  | "out_for_delivery"
  | "completed"
  | "cancelled"
  | "rejected"
  | "refund_pending"
  | "refund_completed";

export interface OrderItem {
  id: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  price_at_order_time: number;
  subtotal: number;
}

export interface OrderDeliveryPartner {
  id: number;
  full_name: string;
  phone: string;
}

export interface OrderDelivery {
  id: number;
  delivery_partner_id?: number | null;
  status: string;
  assigned_at?: string | null;
  picked_up_at?: string | null;
  delivered_at?: string | null;
  delivery_partner?: OrderDeliveryPartner | null;
  otp?: string | null;
  formatted_eta?: string | null;
  expected_time?: string | null;
  estimated_minutes_min?: number | null;
  estimated_minutes_max?: number | null;
  distance_to_target_km?: number | null;
  current_latitude?: number | null;
  current_longitude?: number | null;
}

export interface Order {
  id: number;
  customer_id: number;
  farmer_id: number;
  farmer_name?: string | null;
  total_amount: number;
  status: OrderStatus;
  items: OrderItem[];
  delivery?: OrderDelivery | null;
  reviewed?: boolean;
  created_at: string;
  updated_at: string;
}

// ── Delivery ──────────────────────────────────────────────────────────

export type DeliveryStatus =
  | "pending"
  | "assigned"
  | "accepted"
  | "picked_up"
  | "out_for_delivery"
  | "delivered"
  | "failed";

export interface DeliveryCustomer {
  id: number;
  name: string;
  phone: string;
  address?: string | null;
}

export interface DeliveryFarmer {
  id: number;
  full_name: string;
  phone: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface Delivery {
  id: number;
  order_id: number;
  delivery_partner_id?: number | null;
  partner_id?: number | null;
  status: DeliveryStatus;
  destination_latitude?: number | null;
  destination_longitude?: number | null;
  assigned_at?: string | null;
  picked_up_at?: string | null;
  delivered_at?: string | null;
  actual_delivery?: string | null;
  estimated_delivery?: string | null;
  created_at: string;
  customer?: DeliveryCustomer | null;
  farmer?: DeliveryFarmer | null;
}

export interface AvailableDelivery {
  id: number;
  order_id: number;
  status: DeliveryStatus;
  total_amount: number;
  item_count: number;
  distance_to_farm_km?: number | null;
  distance_to_customer_km?: number | null;
  estimated_earnings: number;
  created_at: string;
  customer?: DeliveryCustomer | null;
  farmer?: DeliveryFarmer | null;
}

export interface PaginatedAvailableDeliveries {
  items: AvailableDelivery[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  partner_latitude?: number | null;
  partner_longitude?: number | null;
  matching_radius_km: number;
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
  inventory_id?: number;
  master_product_id?: number;
}
