"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DesktopFolderProps {
  label: string;
  left: number;
  top: number;
  onMove?: (pos: { left: number; top: number }) => void;
  children: ReactNode;
}

export default function DesktopFolder({ label, left, top, onMove, children }: DesktopFolderProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ startX: number; startY: number; originLeft: number; originTop: number } | null>(null);

  // Click-away to clear selection/close
  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setSelected(false);
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
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
    <div ref={rootRef} className="absolute pointer-events-auto select-none" style={{ left, top }}>
      <button
        type="button"
        onMouseDown={onMouseDown}
        onClick={(e) => { e.stopPropagation(); setSelected(true); }}
        onDoubleClick={() => setOpen((o) => !o)}
        className="flex flex-col items-center w-24 outline-none"
      >
        <div className={cn(
          "w-16 h-16 mb-2 rounded-xl flex items-center justify-center bg-black/40 border",
          selected ? "border-[var(--macos-accent)]/40 bg-[var(--macos-accent)]/20" : "border-[var(--macos-border)]"
        )}>
          {/* Simple folder glyph */}
          <div className="w-9 h-6 rounded-md bg-white/80" />
        </div>
        <div className={cn("text-xs text-center", selected ? "text-[var(--macos-accent)]" : "text-white")}>{label}</div>
      </button>

      {open && (
        <div className="absolute mt-2 left-0 z-[30] w-[280px] rounded-xl border border-[var(--macos-border)] bg-[var(--macos-surface)]/95 backdrop-blur-xl shadow-2xl p-3">
          <div className="grid grid-cols-3 gap-3">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}


