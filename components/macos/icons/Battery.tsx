"use client";

import { cn } from "@/lib/utils";

interface BatteryProps {
  level?: number; // 0-100
  charging?: boolean;
  className?: string;
}

// Simple macOS-style battery icon with variable fill
export default function Battery({ level = 100, charging = false, className }: BatteryProps) {
  const clamped = Math.max(0, Math.min(100, level));
  const fillPercent = clamped / 100;

  // Inner fill width relative to inner rect width (20 units)
  const innerMaxWidth = 20;
  const innerWidth = Math.max(1, Math.round(innerMaxWidth * fillPercent));

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 28 20"
      className={cn("align-middle", className)}
      aria-label="Battery"
    >
      {/* Body */}
      <rect
        x="1"
        y="3"
        rx="3"
        ry="3"
        width="24"
        height="14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.9"
      />
      {/* Cap */}
      <rect x="25.5" y="7" width="2" height="6" rx="1" fill="currentColor" opacity="0.9" />
      {/* Fill */}
      <rect
        x="3"
        y="5"
        width={innerWidth}
        height="10"
        rx="2"
        fill="currentColor"
        opacity={charging ? 0.95 : 0.8}
      />
      {charging && (
        <path
          d="M14 6l-3 4h3l-2 4 6-6h-4z"
          fill="#fff"
          opacity="0.95"
        />
      )}
    </svg>
  );
}


