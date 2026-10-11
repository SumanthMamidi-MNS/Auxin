"use client";
/**
 * components/ui/ImageWithOverlay.tsx — Auxin v3.0
 * Wraps Next/Image with consistent aspect ratio, bottom gradient scrim,
 * warm color filter, shimmer skeleton, and error fallbacks.
 */

import { useState } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import { Leaf } from "lucide-react";

interface ImageWithOverlayProps {
  src: string;
  alt: string;
  aspectRatio?: "4:5" | "16:9" | "1:1" | "3:4" | "custom";
  className?: string;
  imageClassName?: string;
  overlay?: boolean;
  overlayGradient?: "subtle" | "full" | "none";
  sizes?: string;
  priority?: boolean;
  children?: React.ReactNode;
}

export function ImageWithOverlay({
  src,
  alt,
  aspectRatio = "4:5",
  className,
  imageClassName,
  overlay = true,
  overlayGradient = "subtle",
  sizes = "(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw",
  priority = false,
  children,
}: ImageWithOverlayProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const aspectStyles = {
    "4:5": "aspect-[4/5]",
    "16:9": "aspect-[16/9]",
    "1:1": "aspect-square",
    "3:4": "aspect-[3/4]",
    custom: "",
  };

  const overlayStyles = {
    subtle: "bg-gradient-to-t from-black/45 via-transparent to-transparent",
    full: "bg-gradient-to-t from-black/65 via-black/15 to-transparent",
    none: "",
  };

  return (
    <div
      className={clsx(
        "relative overflow-hidden w-full bg-[var(--surface-2)]",
        aspectStyles[aspectRatio],
        className
      )}
    >
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 skeleton z-10" />
      )}

      {/* Main Image or Error Fallback */}
      {!hasError ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          className={clsx(
            "object-cover transition-all duration-500",
            isLoading ? "opacity-0 scale-95" : "opacity-100 scale-100",
            imageClassName
          )}
          style={{
            filter: "saturate(1.06) brightness(1.01)",
          }}
        />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--surface-2)] text-[var(--text-tertiary)] gap-2">
          <Leaf className="w-8 h-8 text-[var(--primary-dim)] opacity-40" />
          <span className="text-xs font-medium">{alt}</span>
        </div>
      )}

      {/* Scrim Overlay for Text Readability */}
      {overlay && overlayGradient !== "none" && (
        <div
          className={clsx(
            "absolute inset-0 pointer-events-none z-10",
            overlayStyles[overlayGradient]
          )}
        />
      )}

      {/* Inset content (badges, action icons, etc.) */}
      {children && <div className="absolute inset-0 z-20 pointer-events-none [&>*]:pointer-events-auto">{children}</div>}
    </div>
  );
}
