"use client";

import { motion, PanInfo } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  IoPersonCircleOutline,
  IoRocketOutline,
  IoNewspaperOutline,
  IoCallOutline,
  IoChatbubbleEllipsesOutline,
  IoMusicalNotesOutline as IoSpotifyFallback,
  IoImagesOutline
} from "react-icons/io5";

interface AppIconProps {
  icon: React.ReactNode;
  label: string;
  gradient?: string;
  delay?: number;
  onClick?: () => void;
  editing?: boolean;
}

const AppIcon = ({ icon, label, gradient, delay = 0, onClick, editing = false }: AppIconProps) => {
  return (
    <motion.button
      className="flex flex-col items-center space-y-2"
      onClick={!editing ? onClick : undefined}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        damping: 15, 
        stiffness: 300, 
        delay 
      }}
      whileHover={!editing ? { scale: 1.05 } : undefined}
      whileTap={!editing ? { scale: 0.95 } : undefined}
    >
      <div
        className={cn(
          // Responsive icon size
          "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl",
          // iOS tile treatment: subtle border + shadow + glass
          "ring-1 ring-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-md relative overflow-hidden",
          gradient || "bg-gradient-to-br from-blue-400 to-blue-600",
        )}
        style={{
          background: gradient ? undefined : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          // Fallback tint so tiles remain visible even if gradient utilities are purged
          backgroundColor: gradient ? undefined : 'rgba(255,255,255,0.06)'
        }}
      >
        <span className="filter drop-shadow-sm text-white relative z-[1]">{icon}</span>
      </div>
      <span
        className="inline-block text-white text-[10px] sm:text-xs font-medium text-center leading-tight max-w-16 truncate px-1.5 py-0.5 rounded-md bg-black/35 backdrop-blur-[2px] shadow-sm z-10"
      >
        {label}
      </span>
    </motion.button>
  );
};

interface HomeScreenProps {
  onAppOpen?: (appId: string) => void;
  className?: string;
}

export default function HomeScreen({ onAppOpen, className }: HomeScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);

  // App definitions (id -> config)
  const appDefs = useMemo(() => ({
    about: { icon: <IoPersonCircleOutline className="w-7 h-7" />, label: "About", gradient: "bg-gradient-to-br from-gray-600 to-gray-800" },
    projects: { icon: <IoRocketOutline className="w-7 h-7" />, label: "Projects", gradient: "bg-gradient-to-br from-purple-500 to-purple-700" },
    blog: { icon: <IoNewspaperOutline className="w-7 h-7" />, label: "Blog", gradient: "bg-gradient-to-br from-yellow-400 to-orange-500" },
    settings: { icon: <img src="/settings.png" alt="Settings" className="w-11 h-11 sm:w-12 sm:h-12 object-contain" />, label: "Settings", gradient: "bg-gradient-to-br from-gray-500 to-gray-700" },
  } as const), []);

  const defaultOrder = useMemo(() => Object.keys(appDefs), [appDefs]);
  const [iconOrder, setIconOrder] = useState<string[]>(defaultOrder);

  // Load/persist order
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('ios_icon_order') || 'null') as string[] | null;
      if (saved && Array.isArray(saved)) {
        const filtered = saved.filter((id) => id in appDefs);
        const missing = defaultOrder.filter((id) => !filtered.includes(id));
        setIconOrder([...filtered, ...missing]);
      }
    } catch {}
  }, [appDefs, defaultOrder]);
  useEffect(() => {
    try { localStorage.setItem('ios_icon_order', JSON.stringify(iconOrder)); } catch {}
  }, [iconOrder]);

  // Long press to toggle edit mode
  const longPressTimer = useRef<number | null>(null);
  const handlePointerDown = () => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => setEditing(true), 450);
  };
  const clearLongPress = () => { if (longPressTimer.current) window.clearTimeout(longPressTimer.current); };

  const cols = 4;
  const getDropIndex = (info: PanInfo) => {
    const container = containerRef.current;
    if (!container) return 0;
    const rect = container.getBoundingClientRect();
    const x = Math.min(Math.max(info.point.x - rect.left, 0), rect.width - 1);
    const y = Math.min(Math.max(info.point.y - rect.top, 0), rect.height - 1);
    const cellW = rect.width / cols;
    // Estimate cell height from first child
    const first = container.querySelector('[data-app-tile]') as HTMLElement | null;
    const cellH = first ? first.offsetHeight + 16 : 96;
    const col = Math.min(cols - 1, Math.max(0, Math.floor(x / cellW)));
    const row = Math.max(0, Math.floor(y / cellH));
    return row * cols + col;
  };

  const handleReorder = (fromIndex: number, info: PanInfo) => {
    const toIndex = Math.max(0, Math.min(iconOrder.length - 1, getDropIndex(info)));
    if (toIndex === fromIndex) return;
    setIconOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  return (
    <div className={cn(
      // Respect safe areas and adjust paddings per device size
      "flex-1 pt-16 pb-8 px-4 sm:px-6",
      // Prevent page scroll on home screen; windows manage their own scrolling
      "overflow-hidden",
      className
    )}>
      {/* Page indicator dots */}
      <div className="flex justify-center space-x-2 mb-8">
        {[0, 1].map((page) => (
          <motion.div
            key={page}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-200",
              currentPage === page 
                ? "bg-white" 
                : "bg-white/30"
            )}
            whileTap={{ scale: 0.8 }}
            onClick={() => setCurrentPage(page)}
          />
        ))}
      </div>

      {/* App grid with reorder support */}
      <div
        ref={containerRef}
        className="grid grid-cols-4 gap-4 sm:gap-6 auto-rows-max"
        onPointerDown={handlePointerDown}
        onPointerUp={clearLongPress}
        onPointerCancel={clearLongPress}
        onPointerLeave={clearLongPress}
      >
        {iconOrder.map((id, index) => {
          const app = appDefs[id as keyof typeof appDefs];
          return (
            <motion.div
              key={id}
              data-app-tile
              drag={editing}
              dragMomentum={false}
              dragElastic={0.1}
              onDragEnd={(e, info) => editing && handleReorder(index, info)}
              className="touch-none"
            >
              <AppIcon
                icon={app.icon}
                label={app.label}
                gradient={app.gradient}
                delay={index * 0.03}
                onClick={() => onAppOpen?.(id)}
                editing={editing}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Editing controls */}
      {editing && (
        <div className="mt-3 flex justify-center">
          <button
            className="px-3 py-1.5 text-xs rounded-lg bg-white/10 text-white border border-white/20"
            onClick={() => setEditing(false)}
          >
            Done
          </button>
        </div>
      )}

      {/* Dock area - bottom apps */}
      <div className="fixed left-4 right-4 sm:left-6 sm:right-6" style={{ bottom: 'max(16px, calc(env(safe-area-inset-bottom, 0px) + 8px))' }}>
        <div className="rounded-2xl p-0">
          <div className="flex justify-center space-x-4 sm:space-x-6">
            <AppIcon icon={<IoCallOutline className="w-7 h-7" />} label="Contact" gradient="bg-gradient-to-br from-green-500 to-green-700" onClick={() => onAppOpen?.('contact')} />
            <AppIcon icon={<img src="/discord.png" alt="Discord" className="w-11 h-11 sm:w-12 sm:h-12 object-contain" />} label="Discord" gradient="bg-gradient-to-br from-indigo-500 to-violet-600" onClick={() => window.open('https://discord.com/invite/dnrfSMgCvV','_blank','noopener,noreferrer')} />
            <AppIcon icon={<img src="/photos-ios.png" alt="Photos" className="w-11 h-11 sm:w-12 sm:h-12 object-contain" />} label="Photos" gradient="bg-white" onClick={() => onAppOpen?.('gallery')} />
          </div>
        </div>
      </div>
    </div>
  );
}
