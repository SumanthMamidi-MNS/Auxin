"use client";
/**
 * components/ui/Input.tsx — Auxin Admin v2.0
 * Dark Stripe-inspired form inputs.
 */

import { clsx } from "clsx";
import type { InputHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";

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
        <label className="text-sm font-medium text-[#F4F4F5]">
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

const inputBase =
  "w-full h-10 px-3.5 rounded-xl border bg-[#1F1F23] text-[#F4F4F5] text-sm placeholder:text-[#52525B] transition-all duration-150 focus:outline-none";

const inputState = (error?: string) =>
  error
    ? "border-[#EF4444]/50 focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20"
    : "border-[#27272A] hover:border-[#3F3F46] focus:border-[#22C55E] focus:ring-2 focus:ring-[#22C55E]/20";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  iconRight?: ReactNode;
}

export function Input({ label, error, hint, icon, iconRight, className, required, ...props }: InputProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#52525B] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          className={clsx(inputBase, inputState(error), icon && "pl-9", iconRight && "pr-9", className)}
          {...props}
        />
        {iconRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#52525B]">
            {iconRight}
          </span>
        )}
      </div>
    </Field>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  rows?: number;
}

export function Textarea({ label, error, hint, rows = 3, className, required, ...props }: TextareaProps) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      <textarea
        rows={rows}
        className={clsx(
          "w-full px-3.5 py-2.5 rounded-xl border bg-[#1F1F23] text-[#F4F4F5] text-sm",
          "placeholder:text-[#52525B] resize-none transition-all duration-150 focus:outline-none",
          inputState(error),
          className
        )}
        {...props}
      />
    </Field>
  );
}

export function Select({
  label,
  error,
  hint,
  children,
  className,
  required,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <Field label={label} error={error} hint={hint} required={required}>
      <select
        className={clsx(inputBase, inputState(error), "cursor-pointer", className)}
        style={{ colorScheme: "dark" }}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}
