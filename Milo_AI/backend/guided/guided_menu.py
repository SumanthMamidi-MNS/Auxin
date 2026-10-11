# backend/guided/guided_menu.py
"""
Auxin AI — Guided Interaction Menu Hierarchy
Maps authentic platform roles to progressive categories, subcategories, questions, and action triggers.
"""

from typing import Dict, Any, List

GUIDED_MENU_BY_ROLE: Dict[str, List[Dict[str, Any]]] = {
    "customer": [
        {
            "id": "cust_order",
            "title": "🛍️ How to order",
            "description": "Browsing fresh produce, adding to cart, placing orders, and payment options",
            "options": [
                {
                    "id": "opt_cust_browse",
                    "text": "Browse available farm produce catalogue",
                    "type": "action",
                    "action_name": "browse_catalogue",
                    "category": "products"
                },
                {
                    "id": "opt_cust_place_order",
                    "text": "How do I place an order on Auxin?",
                    "type": "knowledge",
                    "query": "How does a customer place an order on Auxin?",
                    "category": "orders"
                },
                {
                    "id": "opt_cust_payment_methods",
                    "text": "What payment methods are supported?",
                    "type": "knowledge",
                    "query": "What payment methods are supported on Auxin?",
                    "category": "payments"
                },
                {
                    "id": "opt_cust_reservation_policy",
                    "text": "What is the 15-minute stock reservation policy?",
                    "type": "knowledge",
                    "query": "How does the 15-minute cart and order reservation policy work on Auxin?",
                    "category": "orders"
                }
            ]
        },
        {
            "id": "cust_tracking",
            "title": "📦 Track my order",
            "description": "Order status, delivery updates, and real-time dispatch details",
            "options": [
                {
                    "id": "opt_cust_order_status",
                    "text": "Where is my active order?",
                    "type": "action",
                    "action_name": "check_order_status",
                    "category": "orders"
                },
                {
                    "id": "opt_cust_order_stages",
                    "text": "What are the order progress stages?",
                    "type": "knowledge",
                    "query": "What are the stages of an Auxin order from placement to delivery?",
                    "category": "orders"
                },
                {
                    "id": "opt_cust_order_address",
                    "text": "Can I modify my delivery address after ordering?",
                    "type": "knowledge",
                    "query": "Can a customer modify their delivery address after placing an order?",
                    "category": "orders"
                }
            ]
        },
        {
            "id": "cust_refunds",
            "title": "💳 Payments & refunds",
            "description": "Refund timelines, escrow security, and payment dispute rules",
            "options": [
                {
                    "id": "opt_cust_refund_policy",
                    "text": "What is the refund policy for cancelled orders?",
                    "type": "knowledge",
                    "query": "What is the refund policy for cancelled orders on Auxin?",
                    "category": "customer"
                },
                {
                    "id": "opt_cust_escrow_safety",
                    "text": "How does Auxin escrow protect my money?",
                    "type": "knowledge",
                    "query": "How does the Auxin escrow payment protection mechanism work for buyers?",
                    "category": "payments"
                },
                {
                    "id": "opt_cust_refund_timeline",
                    "text": "When will my refund reach my bank account?",
                    "type": "knowledge",
                    "query": "What is the refund processing timeline for online and UPI payments?",
                    "category": "customer"
                },
                {
                    "id": "opt_cust_raise_dispute",
                    "text": "How do I raise a dispute for damaged produce?",
                    "type": "knowledge",
                    "query": "How does a customer raise a dispute for damaged or poor quality produce?",
                    "category": "customer"
                }
            ]
        },
        {
            "id": "cust_delivery_info",
            "title": "🚚 Delivery information",
            "description": "Farm-fresh delivery protocols, OTP handoff, and coverage",
            "options": [
                {
                    "id": "opt_cust_farm_sourcing",
                    "text": "How does direct-from-farm delivery work?",
                    "type": "knowledge",
                    "query": "How does Auxin source and deliver farm-fresh produce directly from local farmers?",
                    "category": "products"
                },
                {
                    "id": "opt_cust_otp_handoff",
                    "text": "What is the delivery OTP verification process?",
                    "type": "knowledge",
                    "query": "What is the customer handoff OTP verification rule upon delivery arrival?",
                    "category": "delivery"
                },
                {
                    "id": "opt_cust_organic_standards",
                    "text": "Are Auxin farm products certified organic?",
                    "type": "knowledge",
                    "query": "What are Auxin's organic farming and quality verification standards?",
                    "category": "products"
                }
            ]
        },
        {
            "id": "cust_account",
            "title": "👤 Account & support",
            "description": "Profile details, support contact, and dispute arbitration",
            "options": [
                {
                    "id": "opt_cust_account_info",
                    "text": "Check my profile and account details",
                    "type": "action",
                    "action_name": "check_account_info",
                    "category": "authentication"
                },
                {
                    "id": "opt_cust_contact_support",
                    "text": "How do I contact customer support?",
                    "type": "knowledge",
                    "query": "How can a customer contact Auxin support for help with orders or accounts?",
                    "category": "customer"
                }
            ]
        }
    ],

    "farmer": [
        {
            "id": "farmer_getting_started",
            "title": "🌱 Getting started",
            "description": "Partner onboarding, registration steps, and KYC verification status",
            "options": [
                {
                    "id": "opt_farmer_check_approval",
                    "text": "Check my farmer approval status",
                    "type": "action",
                    "action_name": "check_approval_status",
                    "category": "farmer"
                },
                {
                    "id": "opt_farmer_reg_guide",
                    "text": "How do I register as an Auxin farmer partner?",
                    "type": "knowledge",
                    "query": "How does farmer registration and KYC onboarding work on Auxin?",
                    "category": "farmer"
                },
                {
                    "id": "opt_farmer_docs",
                    "text": "What land and KYC documents are required?",
                    "type": "knowledge",
                    "query": "What documents and details are required for farmer verification?",
                    "category": "farmer"
                }
            ]
        },
        {
            "id": "farmer_products",
            "title": "🌾 Adding and managing products",
            "description": "Harvest inventory, setting prices, and organic soil testing standards",
            "options": [
                {
                    "id": "opt_farmer_browse_products",
                    "text": "View master product catalogue to list crops",
                    "type": "action",
                    "action_name": "browse_catalogue",
                    "category": "farmer"
                },
                {
                    "id": "opt_farmer_add_inventory",
                    "text": "How do I list new harvest inventory and pricing?",
                    "type": "knowledge",
                    "query": "How do farmers add and manage inventory quantities and harvest dates?",
                    "category": "farmer"
                },
                {
                    "id": "opt_farmer_soil_test",
                    "text": "What are the organic soil testing standards?",
                    "type": "knowledge",
                    "query": "What are the organic soil testing and residue guidelines for farmers?",
                    "category": "farmer"
                }
            ]
        },
        {
            "id": "farmer_orders",
            "title": "📦 Orders & deliveries",
            "description": "Order notifications, farm pickup scheduling, and produce packaging",
            "options": [
                {
                    "id": "opt_farmer_order_notifications",
                    "text": "How will I be notified when an order is placed?",
                    "type": "knowledge",
                    "query": "How are farmers notified of buyer orders and what is the pickup SLA?",
                    "category": "farmer"
                },
                {
                    "id": "opt_farmer_pickup_process",
                    "text": "How does courier pickup scheduling work at the farm?",
                    "type": "knowledge",
                    "query": "What is the protocol for delivery partner pickup at the farmer's location?",
                    "category": "delivery"
                }
            ]
        },
        {
            "id": "farmer_payments",
            "title": "💰 Payments & earnings",
            "description": "Escrow payouts, bank account setup, and commission rates",
            "options": [
                {
                    "id": "opt_farmer_payout_timeline",
                    "text": "When are farmer payouts released after delivery?",
                    "type": "knowledge",
                    "query": "When are farmer payouts disbursed from escrow after order completion?",
                    "category": "payments"
                },
                {
                    "id": "opt_farmer_bank_setup",
                    "text": "How do I update my bank account details?",
                    "type": "knowledge",
                    "query": "How can a farmer update their bank account and UPI details safely?",
                    "category": "farmer"
                }
            ]
        },
        {
            "id": "farmer_support",
            "title": "👤 Account & support",
            "description": "Farmer partner assistance, dispute resolution, and profile management",
            "options": [
                {
                    "id": "opt_farmer_support_contact",
                    "text": "How do I contact farmer partner support?",
                    "type": "knowledge",
                    "query": "How can a farmer contact partner support or raise operational issues?",
                    "category": "farmer"
                }
            ]
        }
    ],

    "delivery": [
        {
            "id": "del_registration",
            "title": "📝 Registration & verification",
            "description": "Partner onboarding, vehicle verification, and driving license check",
            "options": [
                {
                    "id": "opt_del_check_approval",
                    "text": "Check my delivery partner approval status",
                    "type": "action",
                    "action_name": "check_approval_status",
                    "category": "delivery"
                },
                {
                    "id": "opt_del_onboarding_guide",
                    "text": "How do I onboard as an Auxin delivery partner?",
                    "type": "knowledge",
                    "query": "How does delivery partner onboarding and vehicle verification work?",
                    "category": "delivery"
                }
            ]
        },
        {
            "id": "del_process",
            "title": "📍 Delivery process",
            "description": "Assigned tasks, 500m geofencing, and customer OTP handoff",
            "options": [
                {
                    "id": "opt_del_check_active",
                    "text": "Check my assigned delivery tasks",
                    "type": "action",
                    "action_name": "check_delivery_status",
                    "category": "delivery"
                },
                {
                    "id": "opt_del_geofence_rule",
                    "text": "How does the 500-meter delivery geofence work?",
                    "type": "knowledge",
                    "query": "How does the 500-meter delivery geofence check work on Auxin?",
                    "category": "delivery"
                },
                {
                    "id": "opt_del_otp_verify",
                    "text": "What is the customer handoff OTP verification rule?",
                    "type": "knowledge",
                    "query": "What is the customer handoff OTP verification rule upon delivery arrival?",
                    "category": "delivery"
                }
            ]
        },
        {
            "id": "del_earnings",
            "title": "💵 Earnings & payments",
            "description": "Delivery fee disbursement, payment schedules, and incentives",
            "options": [
                {
                    "id": "opt_del_earnings_disbursed",
                    "text": "When and how are delivery fees disbursed?",
                    "type": "knowledge",
                    "query": "When and how are delivery partner fees disbursed to bank accounts?",
                    "category": "delivery"
                }
            ]
        },
        {
            "id": "del_issues",
            "title": "⚠️ Delivery issues",
            "description": "Unreachable customer, damaged package reporting, and exceptions",
            "options": [
                {
                    "id": "opt_del_unreachable",
                    "text": "What if the customer is unreachable at delivery?",
                    "type": "knowledge",
                    "query": "What is the protocol if a customer is unreachable or refuses delivery?",
                    "category": "delivery"
                }
            ]
        },
        {
            "id": "del_support",
            "title": "👤 Account & support",
            "description": "Dispatch helpline, availability status toggle, and profile settings",
            "options": [
                {
                    "id": "opt_del_help_contact",
                    "text": "How do I contact delivery dispatch support?",
                    "type": "knowledge",
                    "query": "How can delivery partners contact emergency dispatch support?",
                    "category": "delivery"
                }
            ]
        }
    ],

    "admin": [
        {
            "id": "admin_approvals",
            "title": "✅ Approvals & verification",
            "description": "Review pending farmer and delivery partner applications",
            "options": [
                {
                    "id": "opt_admin_check_stats",
                    "text": "Check platform pending approval statistics",
                    "type": "action",
                    "action_name": "check_admin_stats",
                    "category": "admin"
                },
                {
                    "id": "opt_admin_farmer_kyc_rule",
                    "text": "What is the farmer KYC verification checklist?",
                    "type": "knowledge",
                    "query": "What are the required admin verification checks for onboarding farmers?",
                    "category": "admin"
                },
                {
                    "id": "opt_admin_del_kyc_rule",
                    "text": "What is the delivery partner document verification checklist?",
                    "type": "knowledge",
                    "query": "What are the required checks for delivery partner verification and license validation?",
                    "category": "admin"
                }
            ]
        },
        {
            "id": "admin_management",
            "title": "⚙️ Platform management",
            "description": "Master produce catalogue, commission rates, and dispatch rules",
            "options": [
                {
                    "id": "opt_admin_catalogue_mgt",
                    "text": "How does master produce catalogue management work?",
                    "type": "knowledge",
                    "query": "How do admins manage the master category and master product hierarchy?",
                    "category": "admin"
                }
            ]
        },
        {
            "id": "admin_operations",
            "title": "⚖️ Orders & operations",
            "description": "Customer dispute arbitration, escrow fund release, and cancellations",
            "options": [
                {
                    "id": "opt_admin_dispute_arbitration",
                    "text": "How do admins arbitrate customer disputes and refunds?",
                    "type": "knowledge",
                    "query": "What is the admin procedure for arbitrating customer disputes and releasing escrow?",
                    "category": "admin"
                }
            ]
        },
        {
            "id": "admin_reports",
            "title": "📊 Reports & monitoring",
            "description": "Transaction volumes, system performance, and audit trails",
            "options": [
                {
                    "id": "opt_admin_view_stats",
                    "text": "Inspect platform governance and order volume",
                    "type": "action",
                    "action_name": "check_admin_stats",
                    "category": "admin"
                }
            ]
        },
        {
            "id": "admin_support",
            "title": "🛡️ Support",
            "description": "Escalation procedures, user suspensions, and operational runbooks",
            "options": [
                {
                    "id": "opt_admin_suspension_rules",
                    "text": "What are the user suspension and penalty guidelines?",
                    "type": "knowledge",
                    "query": "What are the guidelines for suspending abusive accounts or partners?",
                    "category": "admin"
                }
            ]
        }
    ],

    "super_admin": [
        {
            "id": "sa_governance",
            "title": "🏛️ Platform governance",
            "description": "Full platform oversight, escrow reconciliation, and policy controls",
            "options": [
                {
                    "id": "opt_sa_check_overview",
                    "text": "Inspect complete platform governance state",
                    "type": "action",
                    "action_name": "check_admin_stats",
                    "category": "super_admin"
                },
                {
                    "id": "opt_sa_escrow_audit",
                    "text": "How does escrow ledger reconciliation and settlement work?",
                    "type": "knowledge",
                    "query": "How is escrow ledger reconciliation performed across razorpay orders?",
                    "category": "super_admin"
                }
            ]
        },
        {
            "id": "sa_users",
            "title": "👥 User management",
            "description": "Admin privilege governance, role modifications, and account access",
            "options": [
                {
                    "id": "opt_sa_admin_roles",
                    "text": "What are the rules for granting or revoking admin privileges?",
                    "type": "knowledge",
                    "query": "What are the security constraints on assigning and revoking admin roles?",
                    "category": "super_admin"
                }
            ]
        },
        {
            "id": "sa_approvals",
            "title": "✅ Approvals",
            "description": "Super admin overrides, escalation arbitration, and final signoffs",
            "options": [
                {
                    "id": "opt_sa_overrides",
                    "text": "How are executive dispute overrides handled?",
                    "type": "knowledge",
                    "query": "What is the escalation procedure for super admin dispute arbitration?",
                    "category": "super_admin"
                }
            ]
        },
        {
            "id": "sa_monitoring",
            "title": "📈 Platform monitoring",
            "description": "API health, vector database latency, and system integrity",
            "options": [
                {
                    "id": "opt_sa_vector_health",
                    "text": "How do I monitor vector search and embedding service status?",
                    "type": "knowledge",
                    "query": "How is Milo AI semantic search and vector database health verified?",
                    "category": "super_admin"
                }
            ]
        },
        {
            "id": "sa_administration",
            "title": "🔐 Administration",
            "description": "Database migrations, audit log review, and emergency controls",
            "options": [
                {
                    "id": "opt_sa_migration_governance",
                    "text": "What is the database migration and schema change policy?",
                    "type": "knowledge",
                    "query": "What are the alembic migration and database schema governance guidelines?",
                    "category": "super_admin"
                }
            ]
        }
    ]
}

def get_guided_options_for_role(role: str) -> List[Dict[str, Any]]:
    """Returns the structured category tree for a given user role."""
    r = (role or "customer").lower()
    return GUIDED_MENU_BY_ROLE.get(r, GUIDED_MENU_BY_ROLE["customer"])
