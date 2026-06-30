"use client";
/**
 * components/ui/Input.tsx — Auxin v2.0
 * Dark theme inputs: Input, Textarea, Select
 */

import { clsx } from "clsx";
import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

/* ── Field wrapper ──────────────────────────────────────────────────────── */

function Field({
  label,
  error,
  hint,
  children,
  required,
}: {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[#FAFAFA]">
          {label}
          {required && <span className="text-[#EF4444] ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-[#EF4444]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[#71717A]">{hint}</p>
      ) : null}
    </div>
  );
}

/* ── Shared input classes ───────────────────────────────────────────────── */

const inputBase =
  "w-full h-11 px-4 rounded-xl border bg-[#18181B] text-[#FAFAFA] text-sm placeholder:text-[#52525B] transition-all duration-150 focus:outline-none";

const inputState = (error?: string) =>
  error
    ? "border-[#EF4444]/50 focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20"
    : "border-[#27272A] hover:border-[#3F3F46] focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20";

/* ── Input ──────────────────────────────────────────────────────────────── */

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export function Input({
  label,
  error,
  hint,
  icon,
  iconRight,
  className,
  required,
  ...props
}: InputProps) {
  const hasIcon = !!icon;
  const hasIconRight = !!iconRight;

  return (
    <Field label={label} error={error} hint={hint} required={required}>
      <div className="relative">
        {hasIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#52525B] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          className={clsx(
            inputBase,
            inputState(error),
            hasIcon && "pl-10",
            hasIconRight && "pr-10",
            className
          )}
          {...props}
        />
        {hasIconRight && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#52525B]">
            {iconRight}
          </span>
        )}
      </div>
    </Field>
  );
}

/* ── Textarea ───────────────────────────────────────────────────────────── */

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  rows?: number;
}

export function Textarea({
  label,
  error,
  hint,
  rows = 3,
  className,
  required,
  ...props
}: TextareaProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      <textarea
        rows={rows}
        className={clsx(
          "w-full px-4 py-3 rounded-xl border bg-[#18181B] text-[#FAFAFA] text-sm",
          "placeholder:text-[#52525B] resize-none transition-all duration-150 focus:outline-none",
          inputState(error),
          className
        )}
        {...props}
      />
    </Field>
  );
}

/* ── Select ─────────────────────────────────────────────────────────────── */

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function Select({
  label,
  error,
  hint,
  children,
  className,
  required,
  ...props
}: SelectProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      <select
        className={clsx(
          inputBase,
          inputState(error),
          "cursor-pointer",
          className
        )}
        style={{ colorScheme: "dark" }}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}
