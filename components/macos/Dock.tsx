"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { useDockContext } from "./DockContext";
import { cn } from "@/lib/utils";
import { User, Palette, Rocket, FileText, Mail, Settings, Trash2, FileVideo, TerminalSquare } from "lucide-react";

interface DockItemProps {
  id: string;
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

const DockItem = ({ id, icon, label, onClick, isActive }: DockItemProps) => {
  const ref = useRef<HTMLButtonElement>(null);
  const { register } = useDockContext();
  const distance = useMotionValue(10000);
  const widthSync = useTransform(distance, [-150, 0, 150], [50, 80, 50]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  // Register element with parent (for minimize animations)
  useEffect(() => {
    register(id, ref.current);
  }, [id, register]);

  return (
    <motion.button
      ref={ref}
      style={{ width }}
      className={cn(
        "aspect-square rounded-2xl flex items-center justify-center text-2xl relative",
        "bg-[var(--macos-surface)] backdrop-blur-md",
        "border border-[var(--macos-glass-border)]",
        "shadow-lg hover:shadow-xl transition-shadow duration-200",
        "group"
      )}
      onClick={onClick}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="select-none" aria-hidden>{icon}</span>
      
      {/* Active indicator */}
      {isActive && (
        <div className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[var(--macos-text-secondary)]/80" />
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" role="tooltip" aria-label={label}>
        <div className="bg-[var(--macos-surface-elevated)] backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium text-[var(--macos-text-primary)] whitespace-nowrap border border-[var(--macos-glass-border)]">
          {label}
        </div>
      </div>
    </motion.button>
  );
};

interface DockProps {
  className?: string;
  onItemClick?: (item: string) => void;
  minimizedIds?: string[];
  hidden?: boolean;
}

export default function Dock({ className, onItemClick, minimizedIds = [], hidden = false }: DockProps) {
  // const [, setHoveredItem] = useState<string | null>(null);
  
  const dockItems = [
    { icon: <User className="w-6 h-6" />, label: "About", id: "about" },
    { icon: <Palette className="w-6 h-6" />, label: "Portfolio", id: "portfolio" },
    { icon: <Rocket className="w-6 h-6" />, label: "Projects", id: "projects" },
    { icon: <FileText className="w-6 h-6" />, label: "Blog", id: "blog" },
    { icon: <Mail className="w-6 h-6" />, label: "Contact", id: "contact" },
    { icon: <Settings className="w-6 h-6" />, label: "Settings", id: "settings" },
  ];

  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      className={cn(
        "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50",
        className
      )}
      data-role="macos-dock"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: hidden ? 40 : 0, opacity: hidden ? 0 : 1 }}
      transition={{ type: "spring", damping: 20, stiffness: 300, delay: 0.2 }}
    >
      <div
        className={cn(
          "flex items-end gap-2 p-2 rounded-2xl",
          "bg-[var(--macos-glass-bg)] backdrop-blur-xl",
          "border border-[var(--macos-glass-border)]",
          "shadow-2xl"
        )}
        onMouseMove={(e) => mouseX.set(e.pageX)}
        onMouseLeave={() => mouseX.set(Infinity)}
      >
        {dockItems.map((item) => (
          <DockItem
            key={item.id}
            id={item.id}
            icon={item.icon}
            label={item.label}
            onClick={() => onItemClick?.(item.id)}
            isActive={minimizedIds.includes(item.id)}
          />
        ))}

        {/* Dynamic Media icon: appears when 'media' included in minimizedIds */}
        {minimizedIds.includes('media') && (
          <DockItem
            id="media"
            icon={<FileVideo className="w-6 h-6" />}
            label="Media"
            onClick={() => onItemClick?.('media')}
            isActive={true}
          />
        )}

        {/* Dynamic Terminal icon: appears when 'terminal' included in minimizedIds */}
        {minimizedIds.includes('terminal') && (
          <DockItem
            id="terminal"
            icon={<TerminalSquare className="w-6 h-6" />}
            label="Terminal"
            onClick={() => onItemClick?.('terminal')}
            isActive={true}
          />
        )}
        
        {/* Separator */}
        <div className="w-px h-12 bg-[var(--macos-separator)] mx-1" />
        
        {/* Trash */}
        <DockItem
          id="trash"
          icon={<Trash2 className="w-6 h-6" />}
          label="Trash"
          onClick={() => onItemClick?.('trash')}
          isActive={false}
        />
      </div>
    </motion.div>
  );
}
