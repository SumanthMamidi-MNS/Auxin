'use client';

import React, { useState, useEffect } from 'react';
import { Rocket, Sparkles, X, ArrowDown } from 'lucide-react';

export function showDeployedNotice() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auxin:show-deployed-notice'));
  }
}

export function DeployedNoticeToast() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleShow = () => {
      setVisible(true);
    };

    window.addEventListener('auxin:show-deployed-notice', handleShow);
    return () => window.removeEventListener('auxin:show-deployed-notice', handleShow);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto">
      <div className="bg-white/95 backdrop-blur-xl border border-emerald-600/30 rounded-2xl p-4 sm:p-5 shadow-[0_20px_60px_-15px_rgba(27,67,50,0.25)] ring-1 ring-black/[0.04] space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#1B4332] to-[#2D6A4F] text-[#D4AF37] flex items-center justify-center shadow-xs">
              <Rocket className="w-4 h-4" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#0F172A] tracking-tight font-['Poppins']">
                  Deployed Soon • Staging Ready
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 border border-emerald-600/20">
                  v4.0 Live
                </span>
              </div>
              <p className="text-[10px] text-[#64748B]">
                Hyper-Local Cluster Rollout in Progress
              </p>
            </div>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="p-1 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-black/[0.05] transition-colors cursor-pointer"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#475569] leading-relaxed">
          The public production cluster is finalizing regional domain deployment for Delhi NCR. You can explore the full-stack system right now using the instant sandbox credentials.
        </p>

        <div className="flex items-center justify-between pt-1 border-t border-black/[0.05]">
          <a
            href="#recruiter"
            onClick={() => setVisible(false)}
            className="btn-press inline-flex items-center gap-1.5 text-xs font-bold text-[#1B4332] hover:text-[#2D6A4F] transition-colors"
          >
            <span>View Sandbox Credentials</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </a>
          <span className="text-[10px] font-mono text-[#64748B]">Auto-dismiss 6s</span>
        </div>
      </div>
    </div>
  );
}
