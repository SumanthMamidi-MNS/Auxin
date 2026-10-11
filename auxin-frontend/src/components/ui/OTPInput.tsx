"use client";
/**
 * components/ui/OTPInput.tsx — Auxin v3.0
 * Premium 6-digit individually segmented OTP input component with
 * auto-advance, backspace regression, clipboard paste, and mobile numeric keypad.
 */

import { useRef, useEffect } from "react";
import { clsx } from "clsx";

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  autoFocus?: boolean;
  id?: string;
}

export function OTPInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  error = false,
  className,
  autoFocus = false,
  id = "otp-input",
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const digits = value.split("").slice(0, length);
  while (digits.length < length) {
    digits.push("");
  }

  const handleChange = (index: number, char: string) => {
    const cleanChar = char.replace(/\D/g, "");
    if (!cleanChar) return;

    const newDigits = [...digits];
    newDigits[index] = cleanChar[cleanChar.length - 1]; // Take the last entered digit
    const newValue = newDigits.join("");
    onChange(newValue);

    // Auto-focus next box
    if (index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        // If current box is empty, delete previous and move focus
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = "";
        onChange(newDigits.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const targetIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div className={clsx("flex items-center justify-center gap-2 sm:gap-3", className)} id={id}>
      {digits.map((digit, idx) => {
        const isFilled = digit.length > 0;
        return (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onPaste={handlePaste}
            onFocus={(e) => e.target.select()}
            className={clsx(
              "w-11 h-13 sm:w-13 sm:h-15 text-center text-xl sm:text-2xl font-bold rounded-xl sm:rounded-2xl transition-all duration-200",
              "border select-none tabular-nums",
              error
                ? "border-[var(--danger)] bg-[var(--danger-bg)] text-[var(--danger)]"
                : isFilled
                ? "border-[var(--primary)] bg-[var(--primary-subtle)] text-[var(--primary-fg)] shadow-xs"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:border-[var(--border-hover)]",
              "focus:border-[var(--primary)] focus:bg-[var(--surface)] focus:shadow-[0_0_0_3px_var(--primary-glow)] focus:outline-none",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            style={{ fontFamily: "var(--font-heading)" }}
          />
        );
      })}
    </div>
  );
}
