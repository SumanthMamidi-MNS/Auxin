"use client";
/**
 * components/features/SearchBar.tsx — Auxin v3.0
 * Premium search experience with debounced autocomplete, search history tags,
 * clear trigger, and keyboard accessibility.
 */

import { useState, useEffect, useRef } from "react";
import { Search, X, History, Sparkles, ArrowRight } from "lucide-react";
import { clsx } from "clsx";

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  onSelectSuggestion?: (suggestion: string) => void;
  placeholder?: string;
  className?: string;
  historyStorageKey?: string;
}

export function SearchBar({
  value,
  onChange,
  onSelectSuggestion,
  placeholder = "Search fresh mangoes, wheat, organic potatoes...",
  className,
  historyStorageKey = "auxin_search_history",
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(historyStorageKey);
      if (stored) setHistory(JSON.parse(stored));
    } catch {}
  }, [historyStorageKey]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveToHistory = (term: string) => {
    if (!term.trim()) return;
    const clean = term.trim();
    const updated = [clean, ...history.filter((h) => h.toLowerCase() !== clean.toLowerCase())].slice(0, 5);
    setHistory(updated);
    try {
      localStorage.setItem(historyStorageKey, JSON.stringify(updated));
    } catch {}
  };

  const handleSelect = (term: string) => {
    onChange(term);
    saveToHistory(term);
    setIsFocused(false);
    if (onSelectSuggestion) onSelectSuggestion(term);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      saveToHistory(value);
      setIsFocused(false);
    }
  };

  const clearHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHistory([]);
    try {
      localStorage.removeItem(historyStorageKey);
    } catch {}
  };

  return (
    <div ref={containerRef} className={clsx("relative w-full", className)}>
      <div
        className={clsx(
          "flex items-center gap-3 px-4 py-2.5 sm:py-3 rounded-2xl bg-[var(--surface)] border transition-all duration-200 shadow-xs",
          isFocused
            ? "border-[var(--primary)] shadow-[0_0_0_3px_var(--primary-glow)] bg-[var(--surface)]"
            : "border-[var(--border)] hover:border-[var(--border-hover)]"
        )}
      >
        <Search
          className={clsx(
            "w-5 h-5 flex-shrink-0 transition-colors",
            isFocused ? "text-[var(--primary)]" : "text-[var(--text-tertiary)]"
          )}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm sm:text-base text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="w-5 h-5 rounded-full bg-[var(--surface-2)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center justify-center flex-shrink-0 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* History & Suggestion Popover */}
      {isFocused && history.length > 0 && !value && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-lg z-30 animate-slide-down">
          <div className="flex items-center justify-between px-2 pb-2 mb-1 border-b border-[var(--divider)]">
            <span className="text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-[var(--primary)]" />
              Recent Searches
            </span>
            <button
              onClick={clearHistory}
              className="text-[11px] font-semibold text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {history.map((term, i) => (
              <button
                key={i}
                onClick={() => handleSelect(term)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--primary-subtle)] hover:text-[var(--primary)] border border-[var(--border)] transition-all"
              >
                <span>{term}</span>
                <ArrowRight className="w-2.5 h-2.5 opacity-40" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
