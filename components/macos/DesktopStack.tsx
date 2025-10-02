"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StackItem {
  id: string;
  icon: ReactNode;
  label: string;
  onOpen: () => void;
}

interface DesktopStackProps {
  label: string;
  left: number;
  top: number;
  onMove?: (pos: { left: number; top: number }) => void;
  items: StackItem[];
}

export default function DesktopStack({ label, left, top, onMove, items }: DesktopStackProps) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<{ startX: number; startY: number; originLeft: number; originTop: number } | null>(null);

  useEffect(() => {
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        setSelected(false);
        setExpanded(false);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    draggingRef.current = { startX: e.clientX, startY: e.clientY, originLeft: left, originTop: top };
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const dx = e.clientX - draggingRef.current.startX;
      const dy = e.clientY - draggingRef.current.startY;
      onMove?.({ left: Math.max(8, draggingRef.current.originLeft + dx), top: Math.max(48, draggingRef.current.originTop + dy) });
    };
    const onMouseUp = () => { draggingRef.current = null; };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMove, left, top]);

  const preview = useMemo(() => items.slice(0, 3), [items]);

  return (
    <div ref={rootRef} className="absolute pointer-events-auto select-none" style={{ left, top }}>
      <button
        type="button"
        onMouseDown={onMouseDown}
        onClick={(e) => { e.stopPropagation(); setSelected(true); setExpanded((v) => !v); }}
        className="flex flex-col items-center w-28 outline-none"
      >
        {/* Stacked preview */}
        <div className="relative w-16 h-16 mb-2">
          <div className={cn("absolute inset-0 rounded-xl bg-black/35 border", selected ? "border-[var(--macos-accent)]/40" : "border-[var(--macos-border)]")} />
          {preview.map((it, i) => (
            <div key={it.id} className="absolute left-0 right-0 flex items-center justify-center" style={{ top: i * 4, zIndex: 10 - i }}>
              <div className="w-14 h-14 rounded-lg overflow-hidden shadow" style={{ transform: `rotate(${i === 1 ? -3 : i === 2 ? 3 : 0}deg)` }}>
                <div className="w-full h-full flex items-center justify-center bg-black/50">
                  {it.icon}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className={cn("text-xs font-semibold text-center", selected ? "text-[var(--macos-accent)]" : "text-white")}>{label}</div>
      </button>

      {expanded && (
        <div className="absolute mt-2 left-0 z-[30] w-64 rounded-xl border border-[var(--macos-border)] bg-[var(--macos-surface)]/95 backdrop-blur-xl shadow-2xl p-2 space-y-1">
          {items.map((it) => (
            <button key={it.id} onClick={it.onOpen} className="w-full flex items-center gap-2 px-2 py-2 rounded-md macos-hover">
              <div className="w-8 h-8 rounded-md overflow-hidden bg-black/40 flex items-center justify-center">
                {it.icon}
              </div>
              <div className="text-sm text-[var(--macos-text-primary)] text-left truncate flex-1">{it.label}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


