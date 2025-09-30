"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import Battery from "../macos/icons/Battery";
import { useBattery } from "./hooks/useBattery";
import AppleLogo from "../macos/icons/AppleLogo";

interface MenuBarProps {
  className?: string;
  hidden?: boolean;
  onMouseLeave?: () => void;
  onOpenWindow?: (id: string) => void;
}

const MenuBarItem = ({ 
  label, 
  isActive, 
  onClick 
}: { 
  label: string; 
  isActive?: boolean;
  onClick?: () => void;
}) => (
  <motion.button
    className={cn(
      "px-2.5 py-[3px] text-[13px] font-medium rounded-[6px] transition-colors duration-150",
      isActive 
        ? "bg-[var(--macos-accent)] text-white" 
        : "text-[var(--macos-text-primary)] hover:bg-[var(--macos-surface)]/60"
    )}
    onClick={onClick}
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
  >
    {label}
  </motion.button>
);

const StatusItem = ({ 
  children, 
  onClick 
}: { 
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <motion.button
    className="px-2 py-[3px] text-[13px] text-[var(--macos-text-secondary)] hover:bg-[var(--macos-surface)]/60 rounded-[6px] transition-colors duration-150"
    onClick={onClick}
    whileHover={{ scale: 1.01 }}
    whileTap={{ scale: 0.99 }}
  >
    {children}
  </motion.button>
);

export default function MenuBar({ className, hidden, onMouseLeave, onOpenWindow }: MenuBarProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const battery = useBattery();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "h-8 px-3 md:px-4",
        "backdrop-blur-2xl",
        "[background:var(--sequoia-menubar-bg)]",
        "border-b border-[var(--sequoia-menubar-separator)]",
        "[box-shadow:var(--sequoia-menubar-shadow)]",
        "flex items-center justify-between",
        "text-[13px] font-medium",
        className
      )}
      initial={{ y: -28 }}
      animate={{ y: hidden ? -28 : 0, opacity: hidden ? 0.9 : 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      onMouseLeave={() => { setActiveMenu(null); onMouseLeave?.(); }}
      style={{ pointerEvents: hidden ? 'none' : 'auto' }}
    >
      {/* Left side - App menu */}
      <div className="flex items-center gap-1 relative">
        <motion.button
          className="px-2.5 py-[3px] rounded-[6px] hover:bg-[var(--macos-surface)]/60 text-[13px]"
          onClick={() => setActiveMenu(activeMenu === 'apple' ? null : 'apple')}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          aria-label="Apple menu"
        >
          <AppleLogo className="w-[14px] h-[14px]" />
        </motion.button>
        <MenuBarItem 
          label="Portfolio" 
          isActive={activeMenu === 'portfolio'}
          onClick={() => setActiveMenu(activeMenu === 'portfolio' ? null : 'portfolio')}
        />
        <MenuBarItem 
          label="About" 
          onClick={() => setActiveMenu(activeMenu === 'about' ? null : 'about')}
        />
        <MenuBarItem 
          label="Projects" 
          onClick={() => setActiveMenu(activeMenu === 'projects' ? null : 'projects')}
        />
        <MenuBarItem 
          label="Contact" 
          onClick={() => setActiveMenu(activeMenu === 'contact' ? null : 'contact')}
        />
      </div>

      {/* Right side - Status items */}
      <div className="flex items-center gap-1">
        <StatusItem>
          <div className="flex items-center gap-1 text-[12px]">
            <Battery level={Math.round(((battery.level ?? 1) * 100))} charging={!!battery.charging} />
            <span>{battery.level !== null ? Math.round(battery.level * 100) : 100}%</span>
          </div>
        </StatusItem>
        <StatusItem>
          <div className="text-[12px] text-right leading-none">
            {formatDate(currentTime)} {formatTime(currentTime)}
          </div>
        </StatusItem>
      </div>

      {/* Apple dropdown */}
      {activeMenu === 'apple' && !hidden && (
        <div className="absolute top-8 left-2 z-[60] min-w-[180px] bg-[var(--macos-surface-elevated)] border border-[var(--macos-glass-border)] shadow-xl rounded-md py-1 backdrop-blur-xl">
          <button
            className="w-full text-left px-3 py-2 text-[13px] hover:bg-[var(--macos-surface)]/60 text-[var(--macos-text-primary)]"
            onClick={() => { onOpenWindow?.('settings'); setActiveMenu(null); }}
          >
            Settings
          </button>
          <button
            className="w-full text-left px-3 py-2 text-[13px] hover:bg-[var(--macos-surface)]/60 text-[var(--macos-text-primary)]"
            onClick={() => { onOpenWindow?.('terminal'); setActiveMenu(null); }}
          >
            Terminal
          </button>
        </div>
      )}
    </motion.div>
  );
}
