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
  ShieldCheck,
  FileText,
  AlertTriangle,
  Settings,
  BarChart3
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

const FALLBACK_ADMIN_CATEGORIES: Record<string, GuidedCategory[]> = {
  admin: [
    {
      id: "admin_approvals",
      title: "✅ Approvals & verification",
      description: "Review pending farmer and delivery partner applications",
      options: [
        { id: "a1", text: "Check platform pending approval statistics", type: "action", action_name: "check_admin_stats" },
        { id: "a2", text: "What is the farmer KYC verification checklist?", type: "knowledge", query: "What are the required admin verification checks for onboarding farmers?" },
        { id: "a3", text: "What is the delivery partner document verification checklist?", type: "knowledge", query: "What are the required checks for delivery partner verification and license validation?" }
      ]
    },
    {
      id: "admin_management",
      title: "⚙️ Platform management",
      description: "Master produce catalogue, commission rates, and dispatch rules",
      options: [
        { id: "a4", text: "How does master produce catalogue management work?", type: "knowledge", query: "How do admins manage the master category and master product hierarchy?" }
      ]
    },
    {
      id: "admin_operations",
      title: "⚖️ Orders & operations",
      description: "Customer dispute arbitration, escrow fund release, and cancellations",
      options: [
        { id: "a5", text: "How do admins arbitrate customer disputes and refunds?", type: "knowledge", query: "What is the admin procedure for arbitrating customer disputes and releasing escrow?" }
      ]
    },
    {
      id: "admin_reports",
      title: "📊 Reports & monitoring",
      description: "Transaction volumes, system performance, and audit trails",
      options: [
        { id: "a6", text: "Inspect platform governance and order volume", type: "action", action_name: "check_admin_stats" }
      ]
    },
    {
      id: "admin_support",
      title: "🛡️ Support",
      description: "Escalation procedures, user suspensions, and operational runbooks",
      options: [
        { id: "a7", text: "What are the user suspension and penalty guidelines?", type: "knowledge", query: "What are the guidelines for suspending abusive accounts or partners?" }
      ]
    }
  ],
  super_admin: [
    {
      id: "sa_governance",
      title: "🏛️ Platform governance",
      description: "Full platform oversight, escrow reconciliation, and policy controls",
      options: [
        { id: "s1", text: "Inspect complete platform governance state", type: "action", action_name: "check_admin_stats" },
        { id: "s2", text: "How does escrow ledger reconciliation and settlement work?", type: "knowledge", query: "How is escrow ledger reconciliation performed across razorpay orders?" }
      ]
    },
    {
      id: "sa_users",
      title: "👥 User management",
      description: "Admin privilege governance, role modifications, and account access",
      options: [
        { id: "s3", text: "What are the rules for granting or revoking admin privileges?", type: "knowledge", query: "What are the security constraints on assigning and revoking admin roles?" }
      ]
    },
    {
      id: "sa_approvals",
      title: "✅ Approvals",
      description: "Super admin overrides, escalation arbitration, and final signoffs",
      options: [
        { id: "s4", text: "How are executive dispute overrides handled?", type: "knowledge", query: "What is the escalation procedure for super admin dispute arbitration?" }
      ]
    },
    {
      id: "sa_monitoring",
      title: "📈 Platform monitoring",
      description: "API health, vector database latency, and system integrity",
      options: [
        { id: "s5", text: "How do I monitor vector search and embedding service status?", type: "knowledge", query: "How is Milo AI semantic search and vector database health verified?" }
      ]
    },
    {
      id: "sa_administration",
      title: "🔐 Administration",
      description: "Database migrations, audit log review, and emergency controls",
      options: [
        { id: "s6", text: "What is the database migration and schema change policy?", type: "knowledge", query: "What are the alembic migration and database schema governance guidelines?" }
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
  const activeRole = (user?.role || "admin").toLowerCase();
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const roleKey = activeRole === "super_admin" ? "super_admin" : "admin";
    setCategories(FALLBACK_ADMIN_CATEGORIES[roleKey] || FALLBACK_ADMIN_CATEGORIES.admin);

    // The guided-options endpoint requires a signed-in account; signed-out
    // visitors keep the built-in fallback categories.
    if (!user) return;

    const fetchCategories = async () => {
      try {
        const res = await api.get("/milo/guided-options");
        const data = res.data;
        if (data.categories && data.categories.length > 0) {
            setCategories(data.categories);
          }
      } catch {
        // Retain verified fallback categories
      }
    };
    fetchCategories();
  }, [activeRole, user]);

  useEffect(() => {
    setConversationId(`milo-admin-session-${Date.now()}`);
  }, [activeRole]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, selectedCategory]);

  const handleResetChat = () => {
    setMessages([]);
    setSelectedCategory(null);
    setInputQuery("");
    setConversationId(`milo-admin-session-${Date.now()}`);
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
            "w-12 h-12 lg:w-14 lg:h-14 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(30,58,138,0.3)] border border-[rgba(255,255,255,0.15)]",
            "bg-gradient-to-tr from-indigo-700 to-indigo-600 text-white cursor-pointer select-none",
            "transition-all duration-300 hover:scale-110 active:scale-95 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          )}
          style={{ animation: "miloPulse 2.5s infinite ease-in-out" }}
          aria-label="Open Milo Assistant"
          title="Admin AI Assistant"
        >
          <style>{`
            @keyframes miloPulse {
              0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.4), 0 8px 32px rgba(30,58,138,0.3); }
              50% { box-shadow: 0 0 0 10px rgba(99,102,241,0.0), 0 8px 36px rgba(30,58,138,0.4); }
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
          "fixed top-0 right-0 h-full w-full sm:w-[480px] z-[1000] flex flex-col shadow-2xl transition-all duration-300 ease-out border-l border-zinc-800",
          "bg-zinc-950 text-zinc-100",
          isOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-full opacity-0 pointer-events-none invisible"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-[64px] flex-shrink-0 border-b border-zinc-800 bg-zinc-900/90 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-sm">
              <Bot size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Milo</span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Online
                </span>
                <span className="text-[9px] uppercase font-bold text-indigo-300 bg-indigo-950 border border-indigo-800/60 px-1.5 py-0.5 rounded">
                  {activeRole}
                </span>
              </div>
              <p className="text-[10px] text-zinc-400">Auxin Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleResetChat}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all cursor-pointer"
              title="Reset Conversation"
              aria-label="Reset Conversation"
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all cursor-pointer"
              aria-label="Close assistant panel"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Main Conversation Stream */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-hide">
          
          {/* Welcome Card */}
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-2">
            <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles size={13} />
              Auxin Assistant
            </div>
            <h3 className="text-sm font-bold text-zinc-100">
              Hi, I’m Milo 👋
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              I’m here to help you quickly find answers and understand how to use Auxin. Choose a topic below or ask me anything.
            </p>
          </div>

          {/* Guided Category Drawer / Questions Drill-Down */}
          {selectedCategory ? (
            <div className="p-3.5 bg-zinc-900 rounded-2xl border border-zinc-800 space-y-2.5 shadow-sm animate-fadeIn">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-xs font-semibold text-indigo-400 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <ArrowLeft size={12} />
                  Back to all topics
                </button>
                <span className="text-[10px] text-zinc-400 font-medium">
                  {selectedCategory.options.length} options
                </span>
              </div>
              <div>
                <h4 className="font-bold text-xs text-zinc-100">{selectedCategory.title}</h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">{selectedCategory.description}</p>
              </div>
              <div className="space-y-1.5 pt-1">
                {selectedCategory.options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      handleOptionClick(opt, selectedCategory);
                    }}
                    disabled={isLoading}
                    className="w-full text-left p-2.5 rounded-xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-800/80 hover:border-indigo-500/50 transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center gap-2 pr-2">
                      {opt.type === "action" ? (
                        <Zap size={13} className="text-amber-400 flex-shrink-0" />
                      ) : (
                        <HelpCircle size={13} className="text-indigo-400 flex-shrink-0" />
                      )}
                      <span className="text-xs text-zinc-200 font-medium leading-snug">{opt.text}</span>
                    </div>
                    <ChevronRight size={13} className="text-zinc-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // High-Level Topics Cards
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Help Topics
                </span>
                <span className="text-[10px] text-zinc-500">
                  Click to explore
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat)}
                    className="w-full text-left p-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800/90 hover:border-indigo-500/50 transition-all flex items-center justify-between group cursor-pointer shadow-xs"
                  >
                    <div>
                      <h4 className="font-semibold text-xs text-zinc-200 group-hover:text-indigo-300 transition-colors">
                        {cat.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug line-clamp-1">
                        {cat.description}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-zinc-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2" />
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
                    ? "bg-indigo-600 text-white rounded-tr-none"
                    : msg.is_error
                    ? "bg-red-950/60 border border-red-800 text-red-200 rounded-tl-none"
                    : "bg-zinc-900 text-zinc-200 border border-zinc-800 rounded-tl-none"
                )}
              >
                <div className="flex items-center justify-between space-x-3 text-[10px] opacity-75 mb-1.5 font-medium border-b border-zinc-800 pb-1">
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
                      className="text-[10px] font-medium text-indigo-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                    >
                      <CornerDownRight size={10} />
                      More in {msg.category_title}
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-[10px] font-medium text-zinc-400 bg-zinc-900 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
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
            <div className="flex items-center space-x-2 text-xs text-zinc-400 italic bg-zinc-900 p-3 rounded-2xl rounded-tl-none border border-zinc-800 w-fit shadow-xs">
              <span className="animate-pulse text-indigo-400">● ● ●</span>
              <span>Milo is thinking...</span>
            </div>
          )}

          <div ref={chatEndRef} className="h-1" />
        </div>

        {/* Free-Text Input Bar (Persistent at Bottom) */}
        <div className="p-3.5 border-t border-zinc-800 bg-zinc-900/90">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask Milo anything..."
              className="flex-1 h-10 px-3.5 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 text-xs placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="w-10 h-10 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 flex items-center justify-center transition-all cursor-pointer shadow-sm"
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
