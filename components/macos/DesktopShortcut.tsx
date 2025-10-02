"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DesktopShortcutProps {
  icon: ReactNode;
  label: string;
  left: number;
  top: number;
  onOpen?: () => void;
  onMove?: (pos: { left: number; top: number }) => void;
}

export default function DesktopShortcut({ icon, label, left, top, onOpen, onMove }: DesktopShortcutProps) {
  const [selected, setSelected] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ startX: number; startY: number; originLeft: number; originTop: number } | null>(null);

  // Click-away to clear selection
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setSelected(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected(true);
  };
  const handleDoubleClick = () => onOpen?.();

  // Drag handlers
  const onMouseDown = (e: React.MouseEvent) => {
    // Begin drag only with primary button
    if (e.button !== 0) return;
    const rect = rootRef.current?.getBoundingClientRect();
    draggingRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originLeft: left,
      originTop: top,
    };
    e.preventDefault();
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - draggingRef.current.startX;
      const dy = e.clientY - draggingRef.current.startY;
      const next = { left: Math.max(8, draggingRef.current.originLeft + dx), top: Math.max(48, draggingRef.current.originTop + dy) };
      onMove?.(next);
    };
    const onMouseUp = () => {
      draggingRef.current = null;
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMove, left, top]);

  return (
    <div
      ref={rootRef}
      className="absolute pointer-events-auto select-none"
      style={{ left, top }}
    >
      <button
        type="button"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseDown={onMouseDown}
        className={cn(
          "flex flex-col items-center w-24 outline-none rounded"
        )}
      >
        <div
          className={cn(
            "w-16 h-16 mb-2 flex items-center justify-center rounded-xl bg-black/40 border",
            selected ? "bg-[var(--macos-accent)]/20 border-[var(--macos-accent)]/40" : "border-[var(--macos-border)]"
          )}
        >
          <span aria-hidden className="block">{icon}</span>
        </div>
        <div
          className={cn(
            "text-xs text-center",
            selected ? "text-[var(--macos-accent)]" : "text-white"
          )}
        >
          {label}
        </div>
      </button>
    </div>
  );
}


