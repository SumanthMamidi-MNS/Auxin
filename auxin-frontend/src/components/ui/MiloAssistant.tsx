"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  ChevronRight, 
  ArrowLeft, 
  RotateCcw, 
  Zap, 
  HelpCircle,
  CornerDownRight,
  ShoppingBag,
  Package,
  CreditCard,
  Truck,
  User,
  Sprout,
  ShieldCheck,
  FileText,
  DollarSign,
  AlertTriangle,
  Settings
} from "lucide-react";
import { clsx } from "clsx";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

interface GuidedOption {
  id: string;
  text: string;
  type: "action" | "knowledge";
  action_name?: string;
  query?: string;
  category?: string;
}

interface GuidedCategory {
  id: string;
  title: string;
  description: string;
  options: GuidedOption[];
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'milo';
  text: string;
  timestamp: string;
  is_error?: boolean;
  is_action?: boolean;
  category_id?: string;
  category_title?: string;
  suggested_options?: GuidedOption[];
}

const FALLBACK_CATEGORIES: Record<string, GuidedCategory[]> = {
  customer: [
    {
      id: "cust_order",
      title: "🛍️ How to order",
      description: "Browsing fresh produce, adding to cart, placing orders, and payment options",
      options: [
        { id: "o1", text: "Browse available farm produce catalogue", type: "action", action_name: "browse_catalogue" },
        { id: "o2", text: "How do I place an order on Auxin?", type: "knowledge", query: "How does a customer place an order on Auxin?" },
        { id: "o3", text: "What payment methods are supported?", type: "knowledge", query: "What payment methods are supported on Auxin?" },
        { id: "o4", text: "What is the 15-minute stock reservation policy?", type: "knowledge", query: "How does the 15-minute cart and order reservation policy work on Auxin?" }
      ]
    },
    {
      id: "cust_tracking",
      title: "📦 Track my order",
      description: "Order status, delivery updates, and real-time dispatch details",
      options: [
        { id: "o5", text: "Where is my active order?", type: "action", action_name: "check_order_status" },
        { id: "o6", text: "What are the order progress stages?", type: "knowledge", query: "What are the stages of an Auxin order from placement to delivery?" },
        { id: "o7", text: "Can I modify my delivery address after ordering?", type: "knowledge", query: "Can a customer modify their delivery address after placing an order?" }
      ]
    },
    {
      id: "cust_refunds",
      title: "💳 Payments & refunds",
      description: "Refund timelines, escrow security, and payment dispute rules",
      options: [
        { id: "o8", text: "What is the refund policy for cancelled orders?", type: "knowledge", query: "What is the refund policy for cancelled orders on Auxin?" },
        { id: "o9", text: "How does Auxin escrow protect my money?", type: "knowledge", query: "How does the Auxin escrow payment protection mechanism work for buyers?" },
        { id: "o10", text: "When will my refund reach my bank account?", type: "knowledge", query: "What is the refund processing timeline for online and UPI payments?" },
        { id: "o11", text: "How do I raise a dispute for damaged produce?", type: "knowledge", query: "How does a customer raise a dispute for damaged or poor quality produce?" }
      ]
    },
    {
      id: "cust_delivery_info",
      title: "🚚 Delivery information",
      description: "Farm-fresh delivery protocols, OTP handoff, and coverage",
      options: [
        { id: "o12", text: "How does direct-from-farm delivery work?", type: "knowledge", query: "How does Auxin source and deliver farm-fresh produce directly from local farmers?" },
        { id: "o13", text: "What is the delivery OTP verification process?", type: "knowledge", query: "What is the customer handoff OTP verification rule upon delivery arrival?" },
        { id: "o14", text: "Are Auxin farm products certified organic?", type: "knowledge", query: "What are Auxin's organic farming and quality verification standards?" }
      ]
    },
    {
      id: "cust_account",
      title: "👤 Account & support",
      description: "Profile details, support contact, and dispute arbitration",
      options: [
        { id: "o15", text: "Check my profile and account details", type: "action", action_name: "check_account_info" },
        { id: "o16", text: "How do I contact customer support?", type: "knowledge", query: "How can a customer contact Auxin support for help with orders or accounts?" }
      ]
    }
  ],
  farmer: [
    {
      id: "farmer_getting_started",
      title: "🌱 Getting started",
      description: "Partner onboarding, registration steps, and KYC verification status",
      options: [
        { id: "f1", text: "Check my farmer approval status", type: "action", action_name: "check_approval_status" },
        { id: "f2", text: "How do I register as an Auxin farmer partner?", type: "knowledge", query: "How does farmer registration and KYC onboarding work on Auxin?" },
        { id: "f3", text: "What land and KYC documents are required?", type: "knowledge", query: "What documents and details are required for farmer verification?" }
      ]
    },
    {
      id: "farmer_products",
      title: "🌾 Adding and managing products",
      description: "Harvest inventory, setting prices, and organic soil testing standards",
      options: [
        { id: "f4", text: "View master product catalogue to list crops", type: "action", action_name: "browse_catalogue" },
        { id: "f5", text: "How do I list new harvest inventory and pricing?", type: "knowledge", query: "How do farmers add and manage inventory quantities and harvest dates?" },
        { id: "f6", text: "What are the organic soil testing standards?", type: "knowledge", query: "What are the organic soil testing and residue guidelines for farmers?" }
      ]
    },
    {
      id: "farmer_orders",
      title: "📦 Orders & deliveries",
      description: "Order notifications, farm pickup scheduling, and produce packaging",
      options: [
        { id: "f7", text: "How will I be notified when an order is placed?", type: "knowledge", query: "How are farmers notified of buyer orders and what is the pickup SLA?" },
        { id: "f8", text: "How does courier pickup scheduling work at the farm?", type: "knowledge", query: "What is the protocol for delivery partner pickup at the farmer's location?" }
      ]
    },
    {
      id: "farmer_payments",
      title: "💰 Payments & earnings",
      description: "Escrow payouts, bank account setup, and commission rates",
      options: [
        { id: "f9", text: "When are farmer payouts released after delivery?", type: "knowledge", query: "When are farmer payouts disbursed from escrow after order completion?" },
        { id: "f10", text: "How do I update my bank account details?", type: "knowledge", query: "How can a farmer update their bank account and UPI details safely?" }
      ]
    },
    {
      id: "farmer_support",
      title: "👤 Account & support",
      description: "Farmer partner assistance, dispute resolution, and profile management",
      options: [
        { id: "f11", text: "How do I contact farmer partner support?", type: "knowledge", query: "How can a farmer contact partner support or raise operational issues?" }
      ]
    }
  ],
  delivery: [
    {
      id: "del_registration",
      title: "📝 Registration & verification",
      description: "Partner onboarding, vehicle verification, and driving license check",
      options: [
        { id: "d1", text: "Check my delivery partner approval status", type: "action", action_name: "check_approval_status" },
        { id: "d2", text: "How do I onboard as an Auxin delivery partner?", type: "knowledge", query: "How does delivery partner onboarding and vehicle verification work?" }
      ]
    },
    {
      id: "del_process",
      title: "📍 Delivery process",
      description: "Assigned tasks, 500m geofencing, and customer OTP handoff",
      options: [
        { id: "d3", text: "Check my assigned delivery tasks", type: "action", action_name: "check_delivery_status" },
        { id: "d4", text: "How does the 500-meter delivery geofence work?", type: "knowledge", query: "How does the 500-meter delivery geofence check work on Auxin?" },
        { id: "d5", text: "What is the customer handoff OTP verification rule?", type: "knowledge", query: "What is the customer handoff OTP verification rule upon delivery arrival?" }
      ]
    },
    {
      id: "del_earnings",
      title: "💵 Earnings & payments",
      description: "Delivery fee disbursement, payment schedules, and incentives",
      options: [
        { id: "d6", text: "When and how are delivery fees disbursed?", type: "knowledge", query: "When and how are delivery partner fees disbursed to bank accounts?" }
      ]
    },
    {
      id: "del_issues",
      title: "⚠️ Delivery issues",
      description: "Unreachable customer, damaged package reporting, and exceptions",
      options: [
        { id: "d7", text: "What if the customer is unreachable at delivery?", type: "knowledge", query: "What is the protocol if a customer is unreachable or refuses delivery?" }
      ]
    },
    {
      id: "del_support",
      title: "👤 Account & support",
      description: "Dispatch helpline, availability status toggle, and profile settings",
      options: [
        { id: "d8", text: "How do I contact delivery dispatch support?", type: "knowledge", query: "How can delivery partners contact emergency dispatch support?" }
      ]
    }
  ]
};

export function MiloAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState<GuidedCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<GuidedCategory | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState("");

  const user = useAuthStore((s) => s.user);
  const activeRole = (user?.role || "customer").toLowerCase();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Listen for open-milo custom events from desktop sidebar or quick triggers
  useEffect(() => {
    const handleOpenMilo = () => setIsOpen(true);
    window.addEventListener("open-milo", handleOpenMilo);
    return () => window.removeEventListener("open-milo", handleOpenMilo);
  }, []);

  // Initialize or fetch role-aware guided categories
  useEffect(() => {
    const roleKey = activeRole in FALLBACK_CATEGORIES ? activeRole : "customer";
    setCategories(FALLBACK_CATEGORIES[roleKey] || FALLBACK_CATEGORIES.customer);

    const fetchCategories = async () => {
      try {
        const res = await api.get("/milo/guided-options");
        const data = res.data;
        if (data.categories && data.categories.length > 0) {
            setCategories(data.categories);
          }
      } catch {
        // Retain verified role-aware fallback categories
      }
    };
    fetchCategories();
  }, [activeRole]);

  // Session conversation ID initialization
  useEffect(() => {
    setConversationId(`milo-session-${Date.now()}`);
  }, [activeRole]);

  // Auto-scroll to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, selectedCategory]);

  const handleResetChat = () => {
    setMessages([]);
    setSelectedCategory(null);
    setInputQuery("");
    setConversationId(`milo-session-${Date.now()}`);
  };

  const executeMiloRequest = async (params: { 
    query: string; 
    action?: string; 
    displayQuery?: string;
    categoryId?: string;
    categoryTitle?: string;
    categoryOptions?: GuidedOption[];
  }) => {
    const displayText = params.displayQuery || params.query;
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      text: displayText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await api.post("/milo/chat", {
        query: params.query,
        action: params.action || undefined,
        conversation_id: conversationId,
      });
      const data = res.data;
      const miloMsg: ChatMessage = {
        id: data.message_id || 'msg-' + Date.now(),
        sender: 'milo',
        text: data.answer || "Sorry, I’m having trouble getting that information right now. Please try again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_action: !!params.action,
        category_id: params.categoryId,
        category_title: params.categoryTitle,
        suggested_options: params.categoryOptions
      };

      setMessages((prev) => [...prev, miloMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        sender: 'milo',
        text: "Sorry, I’m having trouble getting that information right now. Please try again in a moment.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        is_error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputQuery.trim();
    if (!query || isLoading) return;
    setInputQuery('');
    executeMiloRequest({ query });
  };

  const handleOptionClick = (option: GuidedOption, category?: GuidedCategory) => {
    if (option.type === "action" && option.action_name) {
      executeMiloRequest({
        query: option.text,
        action: option.action_name,
        displayQuery: option.text,
        categoryId: category?.id,
        categoryTitle: category?.title,
        categoryOptions: category?.options
      });
    } else {
      executeMiloRequest({
        query: option.query || option.text,
        displayQuery: option.text,
        categoryId: category?.id,
        categoryTitle: category?.title,
        categoryOptions: category?.options
      });
    }
  };

  return (
    <>
      {/* ─── FLOATING ASSISTANT BUTTON ─────────────────────────────────── */}
      <div 
        className={clsx(
          "fixed z-[990] transition-all duration-300",
          "bottom-24 right-4 lg:bottom-12 lg:right-10",
          isOpen ? "opacity-0 scale-0 pointer-events-none invisible" : "opacity-100 scale-100 pointer-events-auto"
        )}
      >
        <button
          onClick={() => setIsOpen(true)}
          className={clsx(
            "w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(21,128,61,0.25)] border border-[rgba(255,255,255,0.15)]",
            "bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white cursor-pointer select-none",
            "transition-all duration-300 hover:scale-110 active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          )}
          style={{ animation: "miloPulse 2.5s infinite ease-in-out" }}
          aria-label="Open Milo Assistant"
          title="Need help? Ask Milo"
        >
          <style>{`
            @keyframes miloPulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.4), 0 8px 32px rgba(21,128,61,0.25); }
              50% { box-shadow: 0 0 0 10px rgba(16,185,129,0.0), 0 8px 36px rgba(21,128,61,0.32); }
            }
          `}</style>
          <Bot className="w-5 h-5 lg:w-6 lg:h-6 group-hover:rotate-12 transition-transform duration-300" />
        </button>
      </div>

      {/* ─── SLIDE-OVER ASSISTANT PANEL ────────────────────────────────── */}
      <div
        className={clsx(
          "fixed inset-0 z-[998] bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none invisible"
        )}
        onClick={() => setIsOpen(false)}
      />

      <aside
        role="dialog"
        aria-modal={isOpen}
        aria-hidden={!isOpen}
        aria-label="Milo assistant panel"
        className={clsx(
          "fixed top-0 right-0 h-full w-full sm:w-[460px] z-[1000] flex flex-col shadow-2xl transition-all duration-300 ease-out border-l border-[var(--border)]",
          "bg-[var(--surface)] text-[var(--text-primary)]",
          isOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-full opacity-0 pointer-events-none invisible"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-[64px] flex-shrink-0 border-b border-[var(--border)] bg-[var(--surface)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[var(--primary-subtle)] border border-[var(--primary-glow-sm)] flex items-center justify-center text-[var(--primary)] shadow-sm">
              <Bot size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm" style={{ fontFamily: "var(--font-heading)" }}>Milo</span>
                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
                <span className="text-[9px] uppercase font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                  {activeRole}
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-tertiary)]">Auxin Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleResetChat}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-overlay)] transition-all cursor-pointer"
              title="Reset Conversation"
              aria-label="Reset Conversation"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-overlay)] transition-all cursor-pointer"
              aria-label="Close assistant panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Main Conversation Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
          
          {/* Welcome Card */}
          <div className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)] shadow-sm space-y-2">
            <div className="flex items-center gap-1.5 text-[var(--primary)] text-xs font-bold uppercase tracking-wider">
              <Sparkles size={13} />
              Auxin Assistant
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">
              Hi, I’m Milo 👋
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              I’m here to help you quickly find answers and understand how to use Auxin. Choose a topic below or ask me anything.
            </p>
          </div>

          {/* Guided Category Drawer / Questions Drill-Down */}
          {selectedCategory ? (
            <div className="p-3.5 bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] space-y-2.5 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs font-semibold text-[var(--primary)] flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <ArrowLeft size={12} />
                  Back to all topics
                </button>
                <span className="text-[10px] text-[var(--text-tertiary)] font-medium">
                  {selectedCategory.options.length} options
                </span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-[var(--text-primary)]">{selectedCategory.title}</h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{selectedCategory.description}</p>
              </div>
              <div className="space-y-1.5 pt-1">
                {selectedCategory.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      handleOptionClick(opt, selectedCategory);
                    }}
                    disabled={isLoading}
                    className="w-full text-left p-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover-overlay)] hover:border-[var(--primary)] transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-2 pr-2">
                      {opt.type === "action" ? (
                        <Zap size={13} className="text-amber-500 flex-shrink-0" />
                      ) : (
                        <HelpCircle size={13} className="text-[var(--primary)] flex-shrink-0" />
                      )}
                      <span className="text-xs text-[var(--text-primary)] font-medium leading-snug">{opt.text}</span>
                    </div>
                    <ChevronRight size={13} className="text-[var(--text-tertiary)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // High-Level Topics Cards
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Help Topics
                </span>
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  Click to explore
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className="w-full text-left p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--hover-overlay)] hover:border-[var(--primary)] transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                  >
                    <div>
                      <h4 className="font-semibold text-xs text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                        {cat.title}
                      </h4>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 leading-snug line-clamp-1">
                        {cat.description}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-[var(--text-tertiary)] group-hover:text-[var(--primary)] group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Conversation History Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col space-y-2 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={clsx(
                  "max-w-[92%] rounded-2xl px-4 py-3 text-xs shadow-sm whitespace-pre-wrap leading-relaxed",
                  msg.sender === 'user'
                    ? "bg-[var(--primary)] text-white rounded-tr-none"
                    : msg.is_error
                    ? "bg-red-900/30 border border-red-700/60 text-red-200 rounded-tl-none"
                    : "bg-[var(--surface-2)] text-[var(--text-primary)] border border-[var(--border)] rounded-tl-none"
                )}
              >
                <div className="flex items-center justify-between space-x-3 text-[10px] opacity-75 mb-1.5 font-medium border-b border-[rgba(255,255,255,0.1)] pb-1">
                  <span className="flex items-center gap-1">
                    {msg.sender === 'user' ? 'You' : 'Milo'}
                    {msg.is_action && <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded font-bold">Action</span>}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>
                <div className="prose prose-invert prose-xs max-w-none leading-relaxed">
                  {msg.text}
                </div>
              </div>

              {/* Follow-up Quick Action Buttons for Milo Answers */}
              {msg.sender === 'milo' && (
                <div className="flex flex-wrap gap-1.5 pl-1 pt-0.5">
                  {msg.category_title && (
                    <button
                      onClick={() => {
                        const foundCat = categories.find(c => c.id === msg.category_id);
                        if (foundCat) setSelectedCategory(foundCat);
                      }}
                      className="text-[10px] font-medium text-[var(--primary)] bg-[var(--surface-2)] hover:bg-[var(--hover-overlay)] border border-[var(--border)] px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                    >
                      <CornerDownRight size={10} />
                      More in {msg.category_title}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-[10px] font-medium text-[var(--text-tertiary)] bg-[var(--surface-2)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-overlay)] border border-[var(--border)] px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                  >
                    <RotateCcw size={10} />
                    All Topics
                  </button>
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-[var(--text-tertiary)] italic bg-[var(--surface-2)] p-3 rounded-2xl rounded-tl-none border border-[var(--border)] w-fit shadow-xs">
              <span className="animate-pulse text-[var(--primary)]">● ● ●</span>
              <span>Milo is thinking...</span>
            </div>
          )}

          <div ref={chatEndRef} className="h-1" />
        </div>

        {/* Free-Text Input Bar (Persistent at Bottom) */}
        <div className="p-3.5 border-t border-[var(--border)] bg-[var(--surface-2)]">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask Milo anything..."
              className="flex-1 h-10 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] text-xs placeholder:text-[var(--text-placeholder)] focus:outline-none focus:border-[var(--primary)] transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] disabled:opacity-50 flex items-center justify-center transition-all cursor-pointer shadow-sm"
              aria-label="Send message"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
