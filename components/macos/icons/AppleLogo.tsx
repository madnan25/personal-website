"use client";

import { cn } from "@/lib/utils";

interface AppleLogoProps {
  className?: string;
}

// Apple logo glyph for the menu bar
export default function AppleLogo({ className }: AppleLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 315"
      width="16"
      height="16"
      className={cn("text-[var(--macos-text-primary)]", className)}
      aria-label="Apple"
    >
      <path
        fill="currentColor"
        d="M213.803 167.508c-.397-40.786 33.323-60.397 34.83-61.323-18.96-27.716-48.46-31.546-58.876-31.972-25.056-2.54-48.84 14.635-61.52 14.635-12.68 0-32.276-14.29-53.095-13.902-27.34.4-52.526 15.88-66.57 40.34-28.26 48.996-7.2 121.41 20.3 161.164 13.416 19.3 29.336 40.94 50.192 40.12 20.13-.8 27.748-12.96 52.072-12.96 24.328 0 31.106 12.96 52.32 12.56 21.68-.4 35.44-19.66 48.656-38.98 15.34-22.82 21.68-44.86 22.08-45.96-.48-.24-42.3-16.2-42.39-63.72Zm-39.8-115.64c11.28-13.68 18.88-32.7 16.8-51.868-16.24.64-35.86 10.84-47.48 24.52-10.44 12.08-19.54 31.46-17.12 50.04 18.08 1.4 36.52-9.16 47.8-22.692Z"
      />
    </svg>
  );
}


