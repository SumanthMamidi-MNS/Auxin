'use client';

/**
 * auxin-landing/src/components/features/ScreensExplorer.tsx
 * ============================================================================
 * AUXIN V4.0 — INTERACTIVE 36-SCREEN ECOSYSTEM EXPLORER
 * 
 * 4 Complete Journeys • 9 Runnable Sequential Steps Each (36 Total)
 * - 🛍️ Customer Journey (9 Mobile iPhone 16 Pro Screens)
 * - 🌾 Cultivator Journey (9 Mobile iPhone 16 Pro Screens)
 * - 🚚 Delivery Partner Journey (9 Mobile iPhone 16 Pro Screens)
 * - 🛡️ Admin Governance Suite (9 MacBook Pro Laptop Screens)
 * 
 * Features:
 * - Ultra-crisp dual device framing (iPhone 16 Pro Titanium & MacBook Pro 16")
 * - 9-dot timeline stepper with interactive click-to-jump
 * - Previous/Next controls with tactile spring press physics (.btn-press)
 * - Flow Intelligence HUD: Actor Intent, Protocol Engine, Live Telemetry
 * - Horizontal thumbnail filmstrip with real-time active ring
 * - Deep-link launcher into running frontend/admin sandbox
 * ============================================================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag,
  Sprout,
  Truck,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Cpu,
  Activity,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Smartphone,
  Laptop
} from 'lucide-react';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3000';

type RoleKey = 'customer' | 'farmer' | 'courier' | 'admin';

interface ScreenSpec {
  id: string;
  stepNum: string;
  name: string;
  route: string;
  imageSrc: string;
  actorIntent: string;
  protocolAction: string;
  telemetry: {
    label1: string;
    value1: string;
    label2: string;
    value2: string;
    label3: string;
    value3: string;
  };
  deepLink: string;
}

const SCREENS_DATABASE: Record<RoleKey, {
  roleTitle: string;
  roleSubtitle: string;
  badge: string;
  icon: typeof ShoppingBag;
  deviceType: 'mobile' | 'laptop';
  screens: ScreenSpec[];
}> = {
  customer: {
    roleTitle: 'Consumer Hyper-Local Journey',
    roleSubtitle: 'Direct-from-farm procurement, sub-2h delivery, and cryptographic escrow lock',
    badge: '9 Mobile Screens',
    icon: ShoppingBag,
    deviceType: 'mobile',
    screens: [
      {
        id: 'C-01',
        stepNum: '01',
        name: 'Authentication & Role Choice',
        route: '/auth',
        imageSrc: '/screenshots/c01_customer_auth.png',
        actorIntent: 'Customer signs in via phone OTP or selects instant one-click demo credentials.',
        protocolAction: 'Initializes Supabase JWT auth session; queries profiles table for routing state.',
        telemetry: {
          label1: 'Actor',
          value1: 'Ananya Sharma',
          label2: 'Auth Mode',
          value2: 'Supabase Phone OTP',
          label3: 'Session State',
          value3: 'Authenticated',
        },
        deepLink: `${APP_URL}/auth`,
      },
      {
        id: 'C-02',
        stepNum: '02',
        name: 'Address & Geofence Coordinates',
        route: '/profile/create',
        imageSrc: '/screenshots/c02_customer_profile.png',
        actorIntent: 'Customer specifies doorstep address and pinpoints high-precision GPS coordinates.',
        protocolAction: 'Validates coordinates against the active 25km geofence polygon node.',
        telemetry: {
          label1: 'Delivery Node',
          value1: 'Palm Grove Enclave',
          label2: 'GPS Lat/Lng',
          value2: '28.4015° N, 77.0678° E',
          label3: 'Cluster Zone',
          value3: 'Gurugram-Sohna 25km',
        },
        deepLink: `${APP_URL}/profile/create`,
      },
      {
        id: 'C-03',
        stepNum: '03',
        name: '25km Hyper-Local Feed',
        route: '/customer/home',
        imageSrc: '/screenshots/c03_customer_home_feed.png',
        actorIntent: 'Customer browses morning harvest items exclusively from farms within 25 km.',
        protocolAction: 'Executes Haversine distance triangulation; strictly filters out distant warehouses.',
        telemetry: {
          label1: 'Radar Radius',
          value1: '25.0 km Strict Geofence',
          label2: 'Nearest Farm',
          value2: 'Sohna Orchards (14.2 km)',
          label3: 'Freshness Window',
          value3: '< 2h Plucked',
        },
        deepLink: `${APP_URL}/customer/home`,
      },
      {
        id: 'C-04',
        stepNum: '04',
        name: 'Product & Farm Provenance Specimen',
        route: '/customer/product/14',
        imageSrc: '/screenshots/c04_customer_product_detail.png',
        actorIntent: 'Customer inspects Ratnagiri Alphonso Mangoes, soil pH 6.8, and cultivator passport.',
        protocolAction: 'Queries farmer_inventory lot telemetry; displays 100% direct cultivator margin.',
        telemetry: {
          label1: 'Cultivator',
          value1: 'Ramesh Kumar (Sohna)',
          label2: 'Batch Cert',
          value2: 'NPOP-ORG-2026-IND-0491',
          label3: 'Soil Telemetry',
          value3: 'pH 6.8 • 0 Chemical',
        },
        deepLink: `${APP_URL}/customer/product/14`,
      },
      {
        id: 'C-05',
        stepNum: '05',
        name: 'Real-Time Cart & Fair Margin',
        route: '/customer/cart',
        imageSrc: '/screenshots/c05_customer_cart.png',
        actorIntent: 'Customer reviews transparent price: 100% to farmer, EV logistics fare, ₹0 middleman cut.',
        protocolAction: 'Locks 15-minute inventory reservation; calculates EV mileage fare based on distance.',
        telemetry: {
          label1: 'Items Total',
          value1: '₹360.00 (100% to Farmer)',
          label2: 'EV Courier Fare',
          value2: '₹40.00 Direct',
          label3: 'Mandi Commission',
          value3: '₹0.00 (0% Deducted)',
        },
        deepLink: `${APP_URL}/customer/cart`,
      },
      {
        id: 'C-06',
        stepNum: '06',
        name: '2-Phase Razorpay Escrow Modal',
        route: '/customer/cart (Escrow Modal)',
        imageSrc: '/screenshots/c06_customer_escrow_modal.png',
        actorIntent: 'Customer authorizes payment held safely in cryptographic escrow until doorstep inspection.',
        protocolAction: 'Invokes /api/v1/escrow/authorize; locks ₹400 in smart vault without immediate settlement.',
        telemetry: {
          label1: 'Escrow Vault',
          value1: 'ESC-2026-948102',
          label2: 'Hold Status',
          value2: 'Authorized (Locked)',
          label3: 'Release Trigger',
          value3: 'Doorstep 6-Digit OTP',
        },
        deepLink: `${APP_URL}/customer/cart`,
      },
      {
        id: 'C-07',
        stepNum: '07',
        name: 'Live Courier GPS & Route Radar',
        route: '/customer/orders',
        imageSrc: '/screenshots/c07_customer_live_tracking_map.png',
        actorIntent: 'Customer tracks Courier Vikram Singh live on Leaflet map en route on Electric Cargo Bike.',
        protocolAction: 'Streams live GPS telemetry over WebSockets; recomputes dynamic ETA every 3 seconds.',
        telemetry: {
          label1: 'Courier',
          value1: 'Vikram Singh (EV Bike)',
          label2: 'Vehicle Plate',
          value2: 'HR-26-EQ-4821',
          label3: 'Live ETA',
          value3: '12 Minutes Remaining',
        },
        deepLink: `${APP_URL}/customer/orders`,
      },
      {
        id: 'C-08',
        stepNum: '08',
        name: 'Doorstep 6-Digit OTP Handshake HUD',
        route: '/customer/orders',
        imageSrc: '/screenshots/c08_customer_doorstep_otp_hud.png',
        actorIntent: 'Customer receives high-contrast Doorstep OTP 482103 to verify produce quality before sharing.',
        protocolAction: 'Generates deterministic cryptographic secret; required by courier app to unlock escrow.',
        telemetry: {
          label1: 'Delivery OTP',
          value1: '4 8 2 1 0 3',
          label2: 'Inspection Gate',
          value2: 'Produce Quality Passed',
          label3: 'Escrow Protection',
          value3: 'Active Until Code Shared',
        },
        deepLink: `${APP_URL}/customer/orders`,
      },
      {
        id: 'C-09',
        stepNum: '09',
        name: 'Order Delivered & Escrow Settled',
        route: '/customer/orders',
        imageSrc: '/screenshots/c09_customer_delivered_settled.png',
        actorIntent: 'Customer views delivery success receipt (1h 48m from pluck), ratings, and tax invoice.',
        protocolAction: 'Escrow contract executes dual payouts: ₹360 to Ramesh Kumar bank and ₹40 to courier.',
        telemetry: {
          label1: 'Total Duration',
          value1: '1h 48m Pluck-to-Plate',
          label2: 'Farmer Payout',
          value2: '₹360 IMPS Executed',
          label3: 'Quality Rating',
          value3: '5.0 ★ Organic Verified',
        },
        deepLink: `${APP_URL}/customer/orders`,
      },
    ],
  },
  farmer: {
    roleTitle: 'Cultivator Enterprise Hub',
    roleSubtitle: '100% direct margins, instant morning harvest publishing, and direct bank settlement',
    badge: '9 Mobile Screens',
    icon: Sprout,
    deviceType: 'mobile',
    screens: [
      {
        id: 'F-01',
        stepNum: '01',
        name: 'Cultivator Onboarding & Sign In',
        route: '/auth?role=farmer',
        imageSrc: '/screenshots/f01_farmer_auth.png',
        actorIntent: 'Cultivator selects Farmer role ("Sell with 100% direct margins") and authenticates.',
        protocolAction: 'Initiates cultivator onboarding pipeline; checks verification requirements.',
        telemetry: {
          label1: 'Role Intent',
          value1: 'Producer / Cultivator',
          label2: 'Auth Target',
          value2: 'Farmer Enterprise Hub',
          label3: 'Direct Margin',
          value3: '100% Guaranteed',
        },
        deepLink: `${APP_URL}/auth?role=farmer`,
      },
      {
        id: 'F-02',
        stepNum: '02',
        name: 'Farm Gate & Land Form',
        route: '/profile/create',
        imageSrc: '/screenshots/f02_farmer_profile_land.png',
        actorIntent: 'Ramesh Kumar inputs farm name (Auxin Green Harvest Farms), survey number, and acreage.',
        protocolAction: 'Registers farm entity; uploads NPOP certificate; flags status as pending admin review.',
        telemetry: {
          label1: 'Farm Name',
          value1: 'Auxin Green Harvest',
          label2: 'Survey Location',
          value2: 'Survey #42, Sohna',
          label3: 'Organic Cert',
          value3: 'NPOP India Certified',
        },
        deepLink: `${APP_URL}/profile/create`,
      },
      {
        id: 'F-03',
        stepNum: '03',
        name: 'Application Under Review',
        route: '/pending-approval',
        imageSrc: '/screenshots/f03_farmer_pending_approval.png',
        actorIntent: 'Farmer views real-time verification radar while admin audits NPOP land credentials.',
        protocolAction: 'Frontend polls profileApi.getProfile() for approval status webhook from Admin Portal.',
        telemetry: {
          label1: 'Review Status',
          value1: 'Pending Admin Audit',
          label2: 'Checks Passed',
          value2: 'Land Registry, GPS Node',
          label3: 'Webhook Poller',
          value3: 'Active (10s Cycle)',
        },
        deepLink: `${APP_URL}/pending-approval`,
      },
      {
        id: 'F-04',
        stepNum: '04',
        name: 'Approved Cultivator Dashboard',
        route: '/farmer/dashboard',
        imageSrc: '/screenshots/f04_farmer_dashboard.png',
        actorIntent: 'Ramesh Kumar accesses active GMV (₹14,850), soil moisture widget (62%), and dispatch alerts.',
        protocolAction: 'Profile status approved; unlocks full inventory publishing and escrow ledger privileges.',
        telemetry: {
          label1: 'Farmer Status',
          value1: 'Approved Cultivator',
          label2: 'Today Harvest Rev',
          value2: '₹14,850 Settled',
          label3: 'Soil Hydration',
          value3: '62% Optimal Moisture',
        },
        deepLink: `${APP_URL}/farmer/dashboard`,
      },
      {
        id: 'F-05',
        stepNum: '05',
        name: 'Inspect Live Harvest Inventory',
        route: '/farmer/inventory',
        imageSrc: '/screenshots/f05_farmer_inventory_check.png',
        actorIntent: 'Farmer inspects stock levels across active batches: Alphonso Mangoes, Desi Tomatoes, Spinach.',
        protocolAction: 'Queries farmer_inventory table; tracks reserved crates against active customer carts.',
        telemetry: {
          label1: 'Alphonso Stock',
          value1: '38 kg Available',
          label2: 'Desi Tomatoes',
          value2: '120 kg In Crates',
          label3: 'Cold Storage',
          value3: '0% (Strictly Forbidden)',
        },
        deepLink: `${APP_URL}/farmer/inventory`,
      },
      {
        id: 'F-06',
        stepNum: '06',
        name: 'Publish Fresh Morning Harvest Lot',
        route: '/farmer/inventory',
        imageSrc: '/screenshots/f06_farmer_publish_lot.png',
        actorIntent: 'Farmer uploads new 50kg batch of Alphonso Mangoes at ₹180/kg with Milo AI price check.',
        protocolAction: 'Inserts batch record into products and inventory; broadcasts availability to 25km feed.',
        telemetry: {
          label1: 'New Lot Size',
          value1: '50.0 kg Plucked Today',
          label2: 'Listing Price',
          value2: '₹180 / kg Direct',
          label3: 'Milo Price AI',
          value3: 'Optimal Benchmark Match',
        },
        deepLink: `${APP_URL}/farmer/inventory`,
      },
      {
        id: 'F-07',
        stepNum: '07',
        name: 'Inbound Order Dispatch Alert',
        route: '/farmer/orders',
        imageSrc: '/screenshots/f07_farmer_orders_dispatch.png',
        actorIntent: 'Order #1 received from Ananya Sharma (Palm Grove Enclave); farmer taps "Request Courier Pickup".',
        protocolAction: 'Transitions order state to confirmed; broadcasts pickup alert to nearest EV couriers within 5 km.',
        telemetry: {
          label1: 'Order Target',
          value1: 'Order #1 (2 kg Mangoes)',
          label2: 'Destination',
          value2: 'Palm Grove Enclave (14.2 km)',
          label3: 'Dispatch Signal',
          value3: 'Courier Broadcasted',
        },
        deepLink: `${APP_URL}/farmer/orders`,
      },
      {
        id: 'F-08',
        stepNum: '08',
        name: 'Farm-Gate Pickup Handshake OTP',
        route: '/farmer/orders',
        imageSrc: '/screenshots/f08_farmer_pickup_otp.png',
        actorIntent: 'Courier Vikram Singh arrives on EV bike; farmer inspects crate seal and enters pickup code.',
        protocolAction: 'Order advances from confirmed to picked_up and out_for_delivery on consumer tracking HUD.',
        telemetry: {
          label1: 'Courier Handover',
          value1: 'Vikram Singh (HR-26)',
          label2: 'Crate Seal',
          value2: 'Insulated & Verified',
          label3: 'Status Shift',
          value3: 'out_for_delivery',
        },
        deepLink: `${APP_URL}/farmer/orders`,
      },
      {
        id: 'F-09',
        stepNum: '09',
        name: 'Direct Bank IMPS Settlement Ledger',
        route: '/farmer/earnings',
        imageSrc: '/screenshots/f09_farmer_earnings_settlement.png',
        actorIntent: 'Farmer views instant ₹360 IMPS credit directly from escrow upon customer doorstep verification.',
        protocolAction: 'Smart escrow contract executes dual payout directly to farmer bank account with ₹0 commission.',
        telemetry: {
          label1: 'Direct Credit',
          value1: '₹360.00 Instant IMPS',
          label2: 'Platform Fee',
          value2: '₹0.00 (Zero Cut)',
          label3: 'Bank UTR',
          value3: 'IMPS/HDFC/2026/910482',
        },
        deepLink: `${APP_URL}/farmer/earnings`,
      },
    ],
  },
  courier: {
    roleTitle: 'Zero-Emission Courier Partner',
    roleSubtitle: 'Electric cargo bikes, algorithmic mission dispatch, and instant wallet settlements',
    badge: '9 Mobile Screens',
    icon: Truck,
    deviceType: 'mobile',
    screens: [
      {
        id: 'D-01',
        stepNum: '01',
        name: 'Courier Sign In & Auth',
        route: '/auth?role=courier',
        imageSrc: '/screenshots/d01_courier_auth.png',
        actorIntent: 'Courier selects Delivery Partner role and signs in using quick phone authentication.',
        protocolAction: 'Creates courier auth session; validates profile onboarding status.',
        telemetry: {
          label1: 'Partner Role',
          value1: 'EV Logistics Courier',
          label2: 'Fleet Tier',
          value2: 'Zero-Emission Cargo',
          label3: 'Auth State',
          value3: 'Verified',
        },
        deepLink: `${APP_URL}/auth?role=courier`,
      },
      {
        id: 'D-02',
        stepNum: '02',
        name: 'Vehicle & Cargo Registration',
        route: '/profile/create',
        imageSrc: '/screenshots/d02_courier_profile_vehicle.png',
        actorIntent: 'Vikram Singh enters Electric Cargo Bike details, driving license, and 60L insulated box specs.',
        protocolAction: 'Registers EV transport telemetry; flags courier profile as pending admin approval.',
        telemetry: {
          label1: 'Vehicle Type',
          value1: 'Electric Cargo Bike',
          label2: 'Plate Number',
          value2: 'HR-26-EQ-4821',
          label3: 'Insulated Box',
          value3: '60L Cold-Lock Crate',
        },
        deepLink: `${APP_URL}/profile/create`,
      },
      {
        id: 'D-03',
        stepNum: '03',
        name: 'Application Under Review',
        route: '/pending-approval',
        imageSrc: '/screenshots/d03_courier_pending_approval.png',
        actorIntent: 'Courier views verification status while admin reviews driving license and EV fitness.',
        protocolAction: 'Courier profile set to pending; polls for administrative approval event.',
        telemetry: {
          label1: 'Review Desk',
          value1: 'Admin Fleet Governance',
          label2: 'Documents',
          value2: 'DL & EV RC Submitted',
          label3: 'Approval Gate',
          value3: 'Awaiting Operator Sign-off',
        },
        deepLink: `${APP_URL}/pending-approval`,
      },
      {
        id: 'D-04',
        stepNum: '04',
        name: 'Active Mission Offer HUD',
        route: '/delivery/dashboard',
        imageSrc: '/screenshots/d04_courier_mission_offer.png',
        actorIntent: 'Courier receives real-time mission: Sohna Orchards to Palm Grove Enclave (14.2 km) for ₹40.00 payout.',
        protocolAction: 'Evaluates courier proximity; reserves delivery mission to Vikram Singh upon acceptance.',
        telemetry: {
          label1: 'Mission Run',
          value1: 'Sohna → Sector 65 (14.2 km)',
          label2: 'Guaranteed Payout',
          value2: '₹40.00 Fixed EV Fare',
          label3: 'Accept Timer',
          value3: '45 Seconds Countdown',
        },
        deepLink: `${APP_URL}/delivery/dashboard`,
      },
      {
        id: 'D-05',
        stepNum: '05',
        name: 'Turn-by-Turn Farm Gate Nav',
        route: '/delivery/dashboard',
        imageSrc: '/screenshots/d05_courier_farm_navigation.png',
        actorIntent: 'Courier follows Leaflet GPS turn-by-turn route vector to Ramesh Kumar Farm in Sohna.',
        protocolAction: 'Generates zero-highway eco-route optimized for low-speed electric cargo bike transit.',
        telemetry: {
          label1: 'Navigation Target',
          value1: 'Sohna Farm Gate #42',
          label2: 'EV Battery',
          value2: '92% Remaining',
          label3: 'Distance to Gate',
          value3: '2.8 km (6 min ETA)',
        },
        deepLink: `${APP_URL}/delivery/dashboard`,
      },
      {
        id: 'D-06',
        stepNum: '06',
        name: 'Farm Pickup & Quality Seal Check',
        route: '/delivery/dashboard',
        imageSrc: '/screenshots/d06_courier_farm_pickup_check.png',
        actorIntent: 'Courier arrives at farm gate, verifies temperature < 15°C, and locks produce into insulated crate.',
        protocolAction: 'Confirms crate handover; advances order status to picked_up.',
        telemetry: {
          label1: 'Gate Verification',
          value1: 'Sohna Farm Gate Arrival',
          label2: 'Crate Temp',
          value2: '14.2°C Fresh Ambient',
          label3: 'Crate State',
          value3: 'Locked & Sealed',
        },
        deepLink: `${APP_URL}/delivery/dashboard`,
      },
      {
        id: 'D-07',
        stepNum: '07',
        name: 'Urban In-Transit Vector',
        route: '/delivery/dashboard',
        imageSrc: '/screenshots/d07_courier_urban_transit.png',
        actorIntent: 'Courier navigates urban transit to customer doorstep; speed 28 km/h, 12 min ETA.',
        protocolAction: 'Broadcasts GPS coordinates every 3s to customer order tracking map and admin radar.',
        telemetry: {
          label1: 'Cruising Speed',
          value1: '28 km/h (EV Limit)',
          label2: 'Distance to Doorstep',
          value2: '4.2 km Remaining',
          label3: 'Transit ETA',
          value3: '12 Minutes Exact',
        },
        deepLink: `${APP_URL}/delivery/dashboard`,
      },
      {
        id: 'D-08',
        stepNum: '08',
        name: 'Doorstep 6-Digit OTP Handshake',
        route: '/delivery/dashboard',
        imageSrc: '/screenshots/d08_courier_doorstep_otp_handshake.png',
        actorIntent: 'Courier arrives at customer Villa 14; enters customer OTP 482103 on high-contrast keypad.',
        protocolAction: 'Validates plain_otp === 482103; triggers smart contract 2-phase escrow release.',
        telemetry: {
          label1: 'Doorstep Location',
          value1: 'Villa 14, Palm Grove',
          label2: 'OTP Validation',
          value2: '482103 Matched',
          label3: 'Escrow Action',
          value3: 'Released Instantly',
        },
        deepLink: `${APP_URL}/delivery/dashboard`,
      },
      {
        id: 'D-09',
        stepNum: '09',
        name: 'Mission Complete & Instant Wallet Payout',
        route: '/delivery/earnings',
        imageSrc: '/screenshots/d09_courier_earnings_payout.png',
        actorIntent: 'Courier receives ₹40.00 credited instantly to EV wallet; daily summary shows 8 runs (₹320 earned).',
        protocolAction: 'Credits courier internal ledger; marks mission completed; unlocks next dispatch run.',
        telemetry: {
          label1: 'Mission Reward',
          value1: '₹40.00 Wallet Credit',
          label2: 'Daily Runs',
          value2: '8 Missions Completed',
          label3: 'Courier Rating',
          value3: '4.95 ★ Top Partner',
        },
        deepLink: `${APP_URL}/delivery/earnings`,
      },
    ],
  },
  admin: {
    roleTitle: 'Command & Governance Suite',
    roleSubtitle: 'Macro GMV density, algorithmic KYC approvals, live courier radar, and escrow vaults',
    badge: '9 Laptop Screens',
    icon: ShieldCheck,
    deviceType: 'laptop',
    screens: [
      {
        id: 'A-01',
        stepNum: '01',
        name: 'Macro Telemetry Dashboard',
        route: '/(admin)/dashboard',
        imageSrc: '/screenshots/a01_admin_telemetry_dashboard.png',
        actorIntent: 'Admin monitors system-wide GMV (₹4,82,400 today), 25km cluster density, and active couriers.',
        protocolAction: 'Aggregates real-time cluster metrics across distributed PostgreSQL and Redis instances.',
        telemetry: {
          label1: 'Grid GMV',
          value1: '₹4,82,400 Today',
          label2: 'Active Couriers',
          value2: '28 on Radar',
          label3: 'Uptime SLA',
          value3: '99.98% High Availability',
        },
        deepLink: `${ADMIN_URL}/dashboard`,
      },
      {
        id: 'A-02',
        stepNum: '02',
        name: 'Cultivator KYC & Land Approvals Desk',
        route: '/(admin)/approvals',
        imageSrc: '/screenshots/a02_admin_cultivator_approvals.png',
        actorIntent: 'Admin reviews Ramesh Kumar NPOP Organic Certificate and approves farm gate registration.',
        protocolAction: 'Transitions user status from pending to approved; dispatches approval webhook to cultivator.',
        telemetry: {
          label1: 'Applicant',
          value1: 'Ramesh Kumar (Sohna)',
          label2: 'Organic Audit',
          value2: 'NPOP India Passed',
          label3: 'Action Executed',
          value3: 'Approved Cultivator',
        },
        deepLink: `${ADMIN_URL}/approvals`,
      },
      {
        id: 'A-03',
        stepNum: '03',
        name: 'Courier Fleet Partner Approvals',
        route: '/(admin)/delivery-partners',
        imageSrc: '/screenshots/a03_admin_courier_approvals.png',
        actorIntent: 'Admin audits Vikram Singh EV registration and cold-storage compliance before activating dispatch.',
        protocolAction: 'Validates commercial EV fitness; registers courier in active 25km dispatch pool.',
        telemetry: {
          label1: 'Courier Applicant',
          value1: 'Vikram Singh (HR-26)',
          label2: 'Fleet Standard',
          value2: 'Zero-Emission Cargo',
          label3: 'Dispatch Pool',
          value3: 'Activated (25km Radar)',
        },
        deepLink: `${ADMIN_URL}/delivery-partners`,
      },
      {
        id: 'A-04',
        stepNum: '04',
        name: 'Real-Time Grid Deliveries Radar',
        route: '/(admin)/deliveries',
        imageSrc: '/screenshots/a04_admin_deliveries_radar.png',
        actorIntent: 'Admin visualizes all active couriers and order vectors in real-time on high-density map.',
        protocolAction: 'Monitors transit velocity, SLA compliance, and alerts on route deviations.',
        telemetry: {
          label1: 'Active Runs',
          value1: '42 Orders In-Transit',
          label2: 'Average Delivery',
          value2: '1h 14m Total Time',
          label3: 'Geofence Breach',
          value3: '0 Detected (100% In-Zone)',
        },
        deepLink: `${ADMIN_URL}/deliveries`,
      },
      {
        id: 'A-05',
        stepNum: '05',
        name: 'Global Orders & Lifecycle Ledger',
        route: '/(admin)/orders',
        imageSrc: '/screenshots/a05_admin_orders_ledger.png',
        actorIntent: 'Admin inspects individual order states, fulfillment timestamps, and delivery verification OTPs.',
        protocolAction: 'Master audit log tracking state transitions: created -> confirmed -> picked_up -> delivered.',
        telemetry: {
          label1: 'Audited Order',
          value1: 'Order #1 (Ananya Sharma)',
          label2: 'Cultivator',
          value2: 'Ramesh Kumar',
          label3: 'Lifecycle State',
          value3: 'out_for_delivery',
        },
        deepLink: `${ADMIN_URL}/orders`,
      },
      {
        id: 'A-06',
        stepNum: '06',
        name: 'Razorpay Escrow Vault Ledger',
        route: '/(admin)/payments',
        imageSrc: '/screenshots/a06_admin_escrow_vault_payments.png',
        actorIntent: 'Admin verifies cryptographic escrow holds, zero stuck balances, and automated IMPS transfers.',
        protocolAction: 'Audits 2-phase authorization holds and guarantees zero unauthorized release of funds.',
        telemetry: {
          label1: 'Locked in Vault',
          value1: '₹18,420 Active Escrow',
          label2: 'Released Today',
          value2: '₹4,63,980 Settled',
          label3: 'Arbitration Hold',
          value3: '0 Stuck Funds',
        },
        deepLink: `${ADMIN_URL}/payments`,
      },
      {
        id: 'A-07',
        stepNum: '07',
        name: 'Master Produce Catalogue & Taxonomy',
        route: '/(admin)/catalogue',
        imageSrc: '/screenshots/a07_admin_catalogue_taxonomy.png',
        actorIntent: 'Admin configures agricultural taxonomy: Orchard Fruits, Soil Greens, NPOP compliance tags.',
        protocolAction: 'Controls system-wide category models, price boundaries, and cold-storage prevention flags.',
        telemetry: {
          label1: 'Active Crops',
          value1: '142 Farm Produce Types',
          label2: 'Pricing Policy',
          value2: 'Fair Minimum Guarantee',
          label3: 'Cold Storage',
          value3: 'Strict Zero Rule',
        },
        deepLink: `${ADMIN_URL}/catalogue`,
      },
      {
        id: 'A-08',
        stepNum: '08',
        name: 'Disputes Arbitration Desk',
        route: '/(admin)/disputes',
        imageSrc: '/screenshots/a08_admin_disputes_arbitration.png',
        actorIntent: 'Admin examines zero-loss dispute queue (crate damages, temperature alerts) with photo evidence.',
        protocolAction: 'Executes automated arbitration; triggers immediate 100% escrow refund when warranted.',
        telemetry: {
          label1: 'Active Tickets',
          value1: '1 Active Investigation',
          label2: 'Dispute Rate',
          value2: '0.04% Grid-Wide',
          label3: 'Resolution Time',
          value3: '< 8 Minutes Average',
        },
        deepLink: `${ADMIN_URL}/disputes`,
      },
      {
        id: 'A-09',
        stepNum: '09',
        name: 'System Audit Logs & Geofence Settings',
        route: '/(admin)/settings',
        imageSrc: '/screenshots/a09_admin_system_settings_logs.png',
        actorIntent: 'Admin manages 25km geofence polygon vertices, notification gateways, and system audit logs.',
        protocolAction: 'Configures regional polygon boundaries and immutable audit trail logging.',
        telemetry: {
          label1: 'Active Polygons',
          value1: 'Gurugram-Sohna 25km #1',
          label2: 'Audit Trail',
          value2: 'Cryptographically Signed',
          label3: 'Security Level',
          value3: 'Enterprise SOC-2 Ready',
        },
        deepLink: `${ADMIN_URL}/settings`,
      },
    ],
  },
};

export function ScreensExplorer() {
  const [activeRole, setActiveRole] = useState<RoleKey>('customer');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  const currentRoleData = SCREENS_DATABASE[activeRole];
  const screens = currentRoleData.screens;
  const currentScreen = screens[activeStepIndex] || screens[0];

  // Reset to first step when role changes
  const handleRoleChange = (role: RoleKey) => {
    setActiveRole(role);
    setActiveStepIndex(0);
  };

  const handlePrev = useCallback(() => {
    setActiveStepIndex((prev) => (prev > 0 ? prev - 1 : screens.length - 1));
  }, [screens.length]);

  const handleNext = useCallback(() => {
    setActiveStepIndex((prev) => (prev < screens.length - 1 ? prev + 1 : 0));
  }, [screens.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  return (
    <section id="screens" className="relative py-28 bg-[#F8FAFC] border-y border-slate-200/80 overflow-hidden">
      {/* ── Background Architectural Accents ── */}
      <div className="absolute inset-0 bg-alabaster-grid opacity-50 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[600px] h-[400px] bg-radial from-emerald-500/5 via-transparent to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-radial from-amber-500/5 via-transparent to-transparent blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* ── Section Header ── */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-semibold text-emerald-800">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>Interactive 36-Screen Ecosystem Explorer</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500 font-mono">9 Steps × 4 Roles</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0B0F19] tracking-tight font-['Poppins']">
            Explore Every Screen of Auxin.{' '}
            <span className="text-gradient-emerald block sm:inline">
              Runnable & Verified.
            </span>
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Step through the complete, end-to-end journey for every ecosystem actor. From initial signup and land registration, to 2-phase cryptographic escrow, live GPS tracking, and instant direct bank settlement.
          </p>
        </div>

        {/* ── Role Selector Tabs ── */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
          {(['customer', 'farmer', 'courier', 'admin'] as RoleKey[]).map((role) => {
            const data = SCREENS_DATABASE[role];
            const Icon = data.icon;
            const isActive = activeRole === role;

            return (
              <button
                key={role}
                onClick={() => handleRoleChange(role)}
                className={`btn-press flex items-center gap-2.5 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#0B0F19] text-white shadow-[0_10px_25px_rgba(11,15,25,0.25)] border border-slate-800'
                    : 'bg-white text-slate-700 hover:text-[#0B0F19] border border-slate-200/90 shadow-sm hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{data.roleTitle.split(' ')[0]} Flow</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-medium ${
                  isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  9 Screens
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Main Stage: Dual Device Frame + Step Intelligence HUD ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-10">
          {/* Left Column: Device Presentation (Mobile iPhone Pro or Laptop MacBook Pro) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            {currentRoleData.deviceType === 'mobile' ? (
              /* ── iPhone 16 Pro Titanium Chassis ── */
              <div className="relative w-full max-w-[340px] sm:max-w-[370px]">
                {/* External Glow */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/20 via-transparent to-amber-500/20 rounded-[55px] blur-2xl opacity-60 -z-10" />

                {/* Titanium Outer Rim */}
                <div className="relative rounded-[48px] p-[10px] bg-gradient-to-b from-[#2E3545] via-[#1E2433] to-[#0E131F] shadow-[0_30px_70px_-15px_rgba(11,15,25,0.45)] border border-slate-700/60">
                  {/* Phone Bezel Inner */}
                  <div className="relative rounded-[40px] overflow-hidden bg-black aspect-[393/852] border border-black flex flex-col">
                    {/* Dynamic Island Notch */}
                    <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 w-24 h-6 bg-black rounded-full flex items-center justify-between px-2 shadow-inner border border-white/10">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500/80 animate-pulse" />
                    </div>

                    {/* Screenshot Container */}
                    <div className="relative w-full h-full bg-slate-900 overflow-hidden">
                      {imgError[currentScreen.imageSrc] ? (
                        /* Graceful Fallback Specimen Card */
                        <div className="w-full h-full bg-gradient-to-b from-slate-900 to-[#0B0F19] text-white p-6 flex flex-col justify-between">
                          <div className="pt-10 space-y-2">
                            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Screen {currentScreen.stepNum} • {currentScreen.id}
                            </span>
                            <h3 className="text-xl font-bold text-white font-['Poppins']">
                              {currentScreen.name}
                            </h3>
                            <p className="text-xs text-slate-300 font-mono">
                              {currentScreen.route}
                            </p>
                          </div>

                          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">{currentScreen.telemetry.label1}</span>
                              <span className="font-semibold text-emerald-300">{currentScreen.telemetry.value1}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">{currentScreen.telemetry.label2}</span>
                              <span className="font-semibold text-white">{currentScreen.telemetry.value2}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">{currentScreen.telemetry.label3}</span>
                              <span className="font-semibold text-amber-400">{currentScreen.telemetry.value3}</span>
                            </div>
                          </div>

                          <div className="pb-4 text-center">
                            <span className="text-[11px] text-slate-400">
                              Direct from Auxin V4.0 Engine
                            </span>
                          </div>
                        </div>
                      ) : (
                        <Image
                          src={currentScreen.imageSrc}
                          alt={currentScreen.name}
                          fill
                          sizes="(max-width: 640px) 340px, 370px"
                          className="object-cover object-top transition-all duration-300"
                          priority
                          onError={() => {
                            setImgError((prev) => ({ ...prev, [currentScreen.imageSrc]: true }));
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Device Spec Badge */}
                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-slate-500">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>iPhone 16 Pro • Native 1179 × 2556 (3x DPR)</span>
                </div>
              </div>
            ) : (
              /* ── MacBook Pro 16" Aluminum Laptop Chassis ── */
              <div className="relative w-full max-w-[620px]">
                {/* External Glow */}
                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500/15 via-transparent to-emerald-500/15 rounded-3xl blur-2xl opacity-60 -z-10" />

                {/* Laptop Display Lid */}
                <div className="relative rounded-t-2xl p-2.5 pb-2 bg-gradient-to-b from-[#2D3342] to-[#1A1F2C] shadow-[0_30px_70px_-15px_rgba(11,15,25,0.45)] border border-slate-600/70">
                  {/* Top Camera Notch */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 z-30 w-12 h-2.5 bg-black rounded-b-md flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                  </div>

                  {/* Display Screen */}
                  <div className="relative rounded-lg overflow-hidden bg-black aspect-[16/10] border border-black/80">
                    {imgError[currentScreen.imageSrc] ? (
                      /* Graceful Fallback Specimen Card for Laptop */
                      <div className="w-full h-full bg-gradient-to-b from-slate-900 to-[#0B0F19] text-white p-8 flex flex-col justify-between">
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Governance Console • {currentScreen.id}
                          </span>
                          <h3 className="text-2xl font-bold text-white font-['Poppins']">
                            {currentScreen.name}
                          </h3>
                          <p className="text-xs text-slate-300 font-mono">
                            {currentScreen.route}
                          </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                          <div>
                            <span className="text-[11px] text-slate-400 block">{currentScreen.telemetry.label1}</span>
                            <span className="text-sm font-semibold text-emerald-300">{currentScreen.telemetry.value1}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block">{currentScreen.telemetry.label2}</span>
                            <span className="text-sm font-semibold text-white">{currentScreen.telemetry.value2}</span>
                          </div>
                          <div>
                            <span className="text-[11px] text-slate-400 block">{currentScreen.telemetry.label3}</span>
                            <span className="text-sm font-semibold text-amber-400">{currentScreen.telemetry.value3}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-slate-400">
                            Enterprise Grid Telemetry
                          </span>
                        </div>
                      </div>
                    ) : (
                      <Image
                        src={currentScreen.imageSrc}
                        alt={currentScreen.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 620px"
                        className="object-cover object-top transition-all duration-300"
                        priority
                        onError={() => {
                          setImgError((prev) => ({ ...prev, [currentScreen.imageSrc]: true }));
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Laptop Aluminum Base/Keyboard Chin */}
                <div className="h-4 sm:h-5 bg-gradient-to-b from-[#4A5568] via-[#2D3748] to-[#1A202C] rounded-b-xl border-t border-slate-600/50 shadow-md flex items-center justify-center relative">
                  <div className="w-16 h-1 bg-[#1A202C] rounded-full" />
                </div>

                {/* Device Spec Badge */}
                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-mono text-slate-500">
                  <Laptop className="w-3.5 h-3.5" />
                  <span>MacBook Pro 16" • Native 1802 × 915</span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Step Intelligence HUD & Interactive Controls */}
          <div className="lg:col-span-6 space-y-6">
            {/* Step Counter & Category Pill */}
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-[#0B0F19] text-white">
                  STEP {currentScreen.stepNum} / 09
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {currentRoleData.roleTitle}
                </span>
              </div>

              {/* Prev / Next Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrev}
                  className="btn-press p-2 rounded-full bg-white border border-slate-200 text-slate-700 hover:text-[#0B0F19] hover:border-slate-300 shadow-sm"
                  aria-label="Previous Screen"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="btn-press p-2 rounded-full bg-[#0B0F19] text-white hover:bg-slate-800 shadow-sm"
                  aria-label="Next Screen"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Screen Title & Route */}
            <div className="space-y-1">
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#0B0F19] font-['Poppins']">
                {currentScreen.name}
              </h3>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-700">
                <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-600/20">
                  {currentScreen.route}
                </span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500 font-mono">{currentScreen.id}</span>
              </div>
            </div>

            {/* Flow Intelligence Cards */}
            <div className="space-y-3.5">
              {/* Card 1: Actor Action */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  <span>Actor Intent & User Action</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {currentScreen.actorIntent}
                </p>
              </div>

              {/* Card 2: Behind-the-Scenes Protocol */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                  <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Protocol Engine & Distributed Ledger</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {currentScreen.protocolAction}
                </p>
              </div>

              {/* Card 3: Live Telemetry Specimen */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-md space-y-2 border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-400 uppercase tracking-wider">
                    Verified Telemetry Specimen
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-mono text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    LIVE DATA
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {currentScreen.telemetry.label1}
                    </span>
                    <span className="font-semibold text-white truncate block">
                      {currentScreen.telemetry.value1}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {currentScreen.telemetry.label2}
                    </span>
                    <span className="font-semibold text-emerald-300 truncate block">
                      {currentScreen.telemetry.value2}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {currentScreen.telemetry.value3}
                    </span>
                    <span className="font-semibold text-amber-400 truncate block">
                      {currentScreen.telemetry.value3}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Deep Link Launch CTA */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href={currentScreen.deepLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-[0_4px_14px_rgba(5,150,105,0.3)] transition-all"
              >
                <span>Launch Live Route in App</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
              <span className="text-xs text-slate-500 font-mono">
                Use Arrow Keys (← / →) to navigate
              </span>
            </div>
          </div>
        </div>

        {/* ── 9-Step Timeline Stepper Dots ── */}
        <div className="mb-8 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between relative">
            {/* Connecting Line */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-600 transition-all duration-300 -z-0"
              style={{ width: `${(activeStepIndex / (screens.length - 1)) * 100}%` }}
            />

            {screens.map((step, idx) => {
              const isPassed = idx < activeStepIndex;
              const isCurrent = idx === activeStepIndex;

              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`btn-press relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent
                      ? 'bg-[#0B0F19] text-white scale-110 shadow-md ring-4 ring-emerald-500/20'
                      : isPassed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-500 border border-slate-300 hover:border-slate-400'
                  }`}
                  title={`${step.stepNum}. ${step.name}`}
                >
                  {step.stepNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Horizontal Thumbnail Filmstrip ── */}
        <div className="overflow-x-auto pb-4 scrollbar-none">
          <div className="flex items-center gap-3 min-w-max px-2">
            {screens.map((step, idx) => {
              const isCurrent = idx === activeStepIndex;

              return (
                <button
                  key={step.id}
                  onClick={() => setActiveStepIndex(idx)}
                  className={`btn-press text-left p-2.5 rounded-xl transition-all border ${
                    isCurrent
                      ? 'bg-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20'
                      : 'bg-white/70 hover:bg-white border-slate-200 hover:border-slate-300 shadow-sm opacity-80 hover:opacity-100'
                  } w-44 sm:w-48`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                    <span className="font-bold text-slate-700">STEP {step.stepNum}</span>
                    <span className="text-emerald-700">{step.id}</span>
                  </div>
                  <p className="text-xs font-semibold text-[#0B0F19] truncate">
                    {step.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">
                    {step.route}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
