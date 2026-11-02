'use client';

import React from 'react';

interface BorderBeamProps {
  className?: string;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
}

export function BorderBeam({
  className = '',
  duration = 8,
  borderWidth = 2,
  colorFrom = '#10B981',
  colorTo = '#F59E0B',
}: BorderBeamProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] ${className}`}>
      <svg
        className="absolute inset-0 h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <defs>
          <linearGradient id="borderBeamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colorFrom} stopOpacity="0" />
            <stop offset="50%" stopColor={colorFrom} stopOpacity="1" />
            <stop offset="100%" stopColor={colorTo} stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect
          x={borderWidth / 2}
          y={borderWidth / 2}
          width={`calc(100% - ${borderWidth}px)`}
          height={`calc(100% - ${borderWidth}px)`}
          rx="16"
          stroke="url(#borderBeamGradient)"
          strokeWidth={borderWidth}
          strokeDasharray="180 820"
          className="border-beam-rect"
          style={{
            animation: `borderBeamCycle ${duration}s linear infinite`,
          }}
        />
      </svg>
    </div>
  );
}
