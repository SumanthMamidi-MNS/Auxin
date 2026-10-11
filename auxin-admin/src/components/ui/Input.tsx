"use client";
/**
 * components/ui/Input.tsx — Auxin Admin v2.0 Phase 3.1
 * Premium dashboard form inputs using design system tokens.
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
        <label className="text-sm font-semibold text-[var(--text-primary)]">
          {label}
          {required && <span className="text-[var(--danger)] ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-[var(--danger)]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[var(--text-tertiary)]">{hint}</p>
      ) : null}
    </div>
  );
}

const inputBase =
  "w-full h-10 px-3.5 rounded-xl border " +
  "bg-[var(--surface-2)] text-[var(--text-primary)] text-sm " +
  "placeholder:text-[var(--text-placeholder)] " +
  "transition-all duration-[150ms] ease-out focus:outline-none";

const inputState = (error?: string) =>
  error
    ? "border-[var(--danger-border)] focus:border-[var(--danger)] focus:ring-2 focus:ring-[var(--danger-bg)]"
    : "border-[var(--border)] hover:border-[var(--border-2)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-glow-sm)]";

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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-placeholder)] pointer-events-none">
            {icon}
          </span>
        )}
        <input
          aria-invalid={error ? true : undefined}
          className={clsx(inputBase, inputState(error), icon && "pl-9", iconRight && "pr-9", className)}
          {...props}
        />
        {iconRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-placeholder)]">
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
        aria-invalid={error ? true : undefined}
        rows={rows}
        className={clsx(
          "w-full px-3.5 py-2.5 rounded-xl border",
          "bg-[var(--surface-2)] text-[var(--text-primary)] text-sm",
          "placeholder:text-[var(--text-placeholder)] resize-none",
          "transition-all duration-[150ms] ease-out focus:outline-none",
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
        aria-invalid={error ? true : undefined}
        className={clsx(inputBase, inputState(error), "cursor-pointer", className)}
        style={{ colorScheme: "dark" }}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}
