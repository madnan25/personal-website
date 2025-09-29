"use client";

import { createContext, useCallback, useContext, useMemo, useRef } from "react";

type DockRegistry = Record<string, HTMLElement | null>;

interface DockContextValue {
  register: (id: string, el: HTMLElement | null) => void;
  getEl: (id: string) => HTMLElement | null;
  minimizedIds: string[];
  setMinimized: (ids: string[]) => void;
}

const DockContext = createContext<DockContextValue | null>(null);

export function useDockContext() {
  const ctx = useContext(DockContext);
  if (!ctx) throw new Error("useDockContext must be used within DockProvider");
  return ctx;
}

export function DockProvider({ children }: { children: React.ReactNode }) {
  const registryRef = useRef<DockRegistry>({});
  const minimizedRef = useRef<string[]>([]);
  const listeners = useRef(new Set<() => void>());

  const register = useCallback((id: string, el: HTMLElement | null) => {
    registryRef.current[id] = el;
  }, []);

  const getEl = useCallback((id: string) => {
    return registryRef.current[id] ?? null;
  }, []);

  const setMinimized = useCallback((ids: string[]) => {
    minimizedRef.current = ids;
    listeners.current.forEach((l) => l());
  }, []);

  const value = useMemo<DockContextValue>(() => ({
    register,
    getEl,
    minimizedIds: minimizedRef.current,
    setMinimized
  }), [getEl, register, setMinimized]);

  return (
    <DockContext.Provider value={value}>{children}</DockContext.Provider>
  );
}


