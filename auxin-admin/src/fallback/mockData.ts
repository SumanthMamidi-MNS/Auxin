/**
 * fallback/mockData.ts — Admin app demo data
 * Static mock entities for the admin fallback layer.
 */
import type { User, Product, Order, Delivery, Farmer, Dispute } from "../types";

export const MOCK_USERS: User[] = [
  { id: 1, name: "Aarav Kumar",  phone: "+919999999999", email: "admin@auxin.dev",    role: "admin",    status: "approved", created_at: "2025-01-01T00:00:00Z" },
  { id: 2, name: "Priya Sharma", phone: "+918888888888", email: "customer@auxin.dev", role: "customer", status: "approved", created_at: "2025-01-02T00:00:00Z" },
  { id: 3, name: "Rajan Patel",  phone: "+917777777777", email: "farmer@auxin.dev",   role: "farmer",   status: "approved", created_at: "2025-01-03T00:00:00Z" },
  { id: 4, name: "Vikram Singh", phone: "+916666666666", email: "delivery@auxin.dev", role: "delivery", status: "pending",  created_at: "2025-01-04T00:00:00Z" },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: 1, farmer_id: 3, farmer_name: "Rajan Patel", name: "Fresh Tomatoes",   description: "Sun-ripened tomatoes.",          price: 45,  quantity: 200, unit: "kg",     harvest_date: "2026-05-10", image_url: null, is_active: true, created_at: "2026-05-01T00:00:00Z" },
  { id: 2, farmer_id: 3, farmer_name: "Rajan Patel", name: "Alphonso Mangoes", description: "Premium Alphonso mangoes.",       price: 350, quantity: 50,  unit: "dozen",  harvest_date: "2026-05-08", image_url: null, is_active: true, created_at: "2026-05-01T00:00:00Z" },
  { id: 3, farmer_id: 3, farmer_name: "Rajan Patel", name: "Basmati Rice",     description: "Long-grain aged Basmati rice.",   price: 120, quantity: 500, unit: "kg",     harvest_date: "2026-04-20", image_url: null, is_active: true, created_at: "2026-05-02T00:00:00Z" },
  { id: 4, farmer_id: 3, farmer_name: "Rajan Patel", name: "Fresh Spinach",    description: "Tender baby spinach leaves.",     price: 30,  quantity: 100, unit: "bundle", harvest_date: "2026-05-09", image_url: null, is_active: true, created_at: "2026-05-02T00:00:00Z" },
  { id: 5, farmer_id: 3, farmer_name: "Rajan Patel", name: "Organic Potatoes", description: "Freshly dug organic potatoes.",   price: 35,  quantity: 300, unit: "kg",     harvest_date: "2026-05-07", image_url: null, is_active: true, created_at: "2026-05-03T00:00:00Z" },
  { id: 6, farmer_id: 3, farmer_name: "Rajan Patel", name: "Red Onions",       description: "Premium quality red onions.",     price: 40,  quantity: 250, unit: "kg",     harvest_date: "2026-05-06", image_url: null, is_active: true, created_at: "2026-05-03T00:00:00Z" },
];

export const MOCK_ORDERS: Order[] = [
  { id: 101, customer_id: 2, farmer_id: 3, farmer_name: "Rajan Patel", total_amount: 270, status: "pending",   items: [{ id: 1, product_id: 1, product_name: "Fresh Tomatoes",   quantity: 4, price_at_order_time: 45,  subtotal: 180 }, { id: 2, product_id: 4, product_name: "Fresh Spinach",    quantity: 3, price_at_order_time: 30, subtotal: 90  }], created_at: "2026-05-06T10:30:00Z", updated_at: "2026-05-06T10:30:00Z" },
  { id: 102, customer_id: 2, farmer_id: 3, farmer_name: "Rajan Patel", total_amount: 700, status: "accepted",  items: [{ id: 3, product_id: 2, product_name: "Alphonso Mangoes", quantity: 2, price_at_order_time: 350, subtotal: 700 }],                                                                                                                                   created_at: "2026-05-05T14:00:00Z", updated_at: "2026-05-05T15:00:00Z" },
  { id: 103, customer_id: 2, farmer_id: 3, farmer_name: "Rajan Patel", total_amount: 360, status: "completed", items: [{ id: 4, product_id: 3, product_name: "Basmati Rice",     quantity: 3, price_at_order_time: 120, subtotal: 360 }],                                                                                                                                   created_at: "2026-05-04T09:00:00Z", updated_at: "2026-05-04T20:00:00Z" },
];

export const MOCK_DELIVERIES: Delivery[] = [
  { id: 201, order_id: 102, partner_id: 4, status: "assigned",  estimated_delivery: "2026-05-06T18:00:00Z", created_at: "2026-05-05T15:30:00Z" },
  { id: 202, order_id: 103, partner_id: 4, status: "delivered", actual_delivery:    "2026-05-04T19:45:00Z", created_at: "2026-05-04T10:00:00Z" },
];

export const MOCK_PENDING_FARMERS: Farmer[] = [
  { id: 1, user_id: 3, full_name: "Rajan Patel", phone: "+917777777777", location: "Nashik, Maharashtra", ifsc_code: "HDFC0001234", is_approved: false, created_at: "2026-05-01T00:00:00Z" },
  { id: 2, user_id: 5, full_name: "Meena Devi",  phone: "+915555555555", location: "Amritsar, Punjab",    ifsc_code: "SBIN0009876", is_approved: false, created_at: "2026-05-03T00:00:00Z" },
];

export const MOCK_DISPUTES: Dispute[] = [
  { id: 301, order_id: 101, raised_by: 2, reason: "Received damaged tomatoes — completely rotten.",       status: "open",      resolution_note: null, created_at: "2026-05-06T11:00:00Z", updated_at: "2026-05-06T11:00:00Z" },
  { id: 302, order_id: 102, raised_by: 2, reason: "Mangoes are not Alphonso variety as advertised.",      status: "in_review", resolution_note: null, created_at: "2026-05-05T16:00:00Z", updated_at: "2026-05-06T09:00:00Z" },
];

// Admin demo credentials only — no customer/farmer/delivery accounts here
export const ADMIN_DEMO_CREDENTIALS = [
  { phone: "+919999999999", role: "admin",             label: "Super Admin",      emoji: "👑" },
  { phone: "+911111111111", role: "support_admin",     label: "Support Admin",    emoji: "🎧" },
  { phone: "+912222222222", role: "operations_admin",  label: "Operations Admin", emoji: "⚙️" },
  { phone: "+913333333333", role: "logistics_admin",   label: "Logistics Admin",  emoji: "🚚" },
];

// Extra admin users for sub-role demos
export const MOCK_ADMIN_USERS: User[] = [
  { id: 1,  name: "Aarav Kumar",  phone: "+919999999999", role: "admin",            status: "approved", created_at: "2025-01-01T00:00:00Z" },
  { id: 10, name: "Shreya Iyer",  phone: "+911111111111", role: "support_admin",    status: "approved", created_at: "2025-02-01T00:00:00Z" },
  { id: 11, name: "Arjun Mehta",  phone: "+912222222222", role: "operations_admin", status: "approved", created_at: "2025-03-01T00:00:00Z" },
  { id: 12, name: "Kavya Nair",   phone: "+913333333333", role: "logistics_admin",  status: "approved", created_at: "2025-04-01T00:00:00Z" },
];
