"use client";

import { animate, motion, useMotionValue, PanInfo } from "framer-motion";
import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { useWindowResize, ResizeDir } from "./hooks/useWindowResize";
import { cn } from "@/lib/utils";

interface WindowProps {
  title?: string;
  children: ReactNode;
  className?: string;
  initialPosition?: { x: number; y: number };
  width?: number;
  height?: number;
  resizable?: boolean;
  minWidth?: number;
  minHeight?: number;
  draggable?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: (isMaximized: boolean) => void;
  minimizeTargetEl?: HTMLElement | null;
  showTopChrome?: boolean;
  topOffsetPx?: number;
  onTitleBarHoverChange?: (hover: boolean) => void;
}

const TrafficLight = ({ 
  color, 
  onClick, 
  symbol 
}: { 
  color: 'red' | 'yellow' | 'green';
  onClick?: () => void;
  symbol?: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const colorMap = {
    red: 'bg-[#ff5f56] hover:bg-[#ff4136]',
    yellow: 'bg-[#ffbd2e] hover:bg-[#ffab00]',
    green: 'bg-[#27ca3f] hover:bg-[#00c851]'
  };

  return (
    <motion.button
      className={cn(
        "w-3 h-3 rounded-full transition-all duration-150 flex items-center justify-center text-[8px] font-bold text-black/40",
        colorMap[color]
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    aria-label={color === 'red' ? 'Close window' : color === 'yellow' ? 'Minimize window' : 'Maximize window'}
    >
      {isHovered && symbol && (
        <span className="text-black/60">{symbol}</span>
      )}
    </motion.button>
  );
};

export default function Window({
  title = "Untitled",
  children,
  className,
  initialPosition = { x: 100, y: 100 },
  width = 800,
  height = 600,
  // resizable = false,
  draggable = true,
  resizable = true,
  minWidth = 360,
  minHeight = 240,
  onClose,
  onMinimize,
  onMaximize,
  minimizeTargetEl,
  showTopChrome = true,
  topOffsetPx = 32,
  onTitleBarHoverChange,
}: WindowProps) {
  const MENU_BAR_HEIGHT_PX = 32; // matches h-8 in MenuBar
  const TITLE_BAR_HEIGHT_PX = 40; // matches h-10 in title bar
  const constraintsRef = useRef(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(initialPosition.x);
  const y = useMotionValue(initialPosition.y);
  const scale = useMotionValue(1);
  const { width: winWidth, height: winHeight, isResizing, startResize, setWidth: setWinWidth, setHeight: setWinHeight } = useWindowResize({
    minWidth,
    minHeight,
    initialWidth: width,
    initialHeight: height,
    getPosition: () => ({ x: x.get(), y: y.get() }),
    setPosition: ({ x: nx, y: ny }) => { x.set(nx); y.set(ny); }
  });
  
  const [isMaximized, setIsMaximized] = useState(false);
  const [dragBounds, setDragBounds] = useState<{ left: number; right: number; top: number; bottom: number } | undefined>(undefined);
  
  const handleMaximize = () => {
    const next = !isMaximized;
    setIsMaximized(next);
    onMaximize?.(next);
  };

  const handleMinimize = async () => {
    if (!minimizeTargetEl || !windowRef.current) {
      onMinimize?.();
      return;
    }

    const winRect = windowRef.current.getBoundingClientRect();
    const targetRect = minimizeTargetEl.getBoundingClientRect();

    const winCenterX = winRect.left + winRect.width / 2;
    const winCenterY = winRect.top + winRect.height / 2;
    const targetCenterX = targetRect.left + targetRect.width / 2;
    const targetCenterY = targetRect.top + targetRect.height / 2;

    const originalX = x.get();
    const originalY = y.get();

    const dx = targetCenterX - winCenterX;
    const dy = targetCenterY - winCenterY;

    const spring = { type: "spring" as const, stiffness: 500, damping: 60 };

    await Promise.all([
      animate(x, originalX + dx, spring),
      animate(y, originalY + dy, spring),
      animate(scale, 0.08, { duration: 0.25, ease: [0.22, 1, 0.36, 1] }),
    ]);

    onMinimize?.();

    // Reset transform for when the window is shown again
    x.set(originalX);
    y.set(originalY);
    scale.set(1);
  };

  const handleStartResize = useCallback((dir: ResizeDir, e: React.MouseEvent) => {
    if (!resizable || isMaximized) return;
    startResize(dir, e);
  }, [isMaximized, resizable, startResize]);

  // Recalculate drag bounds whenever viewport or window size changes
  useEffect(() => {
    const recalc = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const keepVisiblePx = 80; // ensure part of the window stays visible
      setDragBounds({
        left: -winWidth + keepVisiblePx,
        right: vw - keepVisiblePx,
        top: MENU_BAR_HEIGHT_PX, // don't allow hiding behind menu bar
        bottom: vh - keepVisiblePx,
      });
    };
    recalc();
    window.addEventListener('resize', recalc);
    return () => window.removeEventListener('resize', recalc);
  }, [winWidth, winHeight]);

  return (
    <div ref={constraintsRef} className="fixed inset-0 pointer-events-none">
      <motion.div
        className={cn(
          "pointer-events-auto absolute",
          "bg-[var(--macos-glass-bg)] backdrop-blur-xl",
          "border border-[var(--macos-glass-border)]",
          "rounded-xl shadow-2xl",
          "overflow-hidden",
          "z-[50]",
          className
        )}
        style={{
          width: isMaximized ? '100vw' : winWidth,
          height: isMaximized ? (showTopChrome ? `calc(100vh - ${topOffsetPx}px)` : '100vh') : winHeight,
          x: isMaximized ? 0 : x,
          y: isMaximized ? (showTopChrome ? topOffsetPx : 0) : y,
          scale: isMaximized ? 1 : scale,
        }}
        ref={windowRef}
        drag={draggable && !isMaximized && !isResizing}
        dragMomentum={false}
        dragElastic={0.1}
        dragConstraints={dragBounds}
        onDragEnd={(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
          if (isMaximized) return;
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const threshold = 24;
          const snapTop = MENU_BAR_HEIGHT_PX + 8;

          const curX = x.get();
          const curY = y.get();
          const movingRight = info.velocity.x > 5 || info.offset.x > 10;
          const movingLeft = info.velocity.x < -5 || info.offset.x < -10;
          const nearLeft = curX < threshold;
          const nearRight = curX + winWidth > vw - threshold;
          const nearTop = curY < threshold;

          let targetX = curX;
          let targetY = curY;

          if (nearLeft && movingLeft) targetX = 0;
          if (nearRight && movingRight) targetX = vw - winWidth;
          if (nearTop) targetY = snapTop;

          // Clamp so the window cannot be completely lost off-screen (keep 80px visible)
          const keepVisiblePx = 80;
          const minX = -winWidth + keepVisiblePx;
          const maxX = vw - keepVisiblePx;
          const minY = 0; // allow reaching the very top gap; menu bar offset is handled elsewhere
          const maxY = vh - keepVisiblePx;

          targetX = Math.max(minX, Math.min(targetX, maxX));
          targetY = Math.max(minY, Math.min(targetY, maxY));

          const updates: Array<Promise<any>> = [];
          if (Math.abs(targetX - curX) > 0.5) updates.push(animate(x, targetX, { type: "spring", stiffness: 600, damping: 40 }));
          if (Math.abs(targetY - curY) > 0.5) updates.push(animate(y, targetY, { type: "spring", stiffness: 600, damping: 40 }));
          if (updates.length) Promise.all(updates);
        }}
        onDragEnd={undefined}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        {/* Title Bar (animates height in full screen) */}
        <motion.div
          className={cn(
            "relative bg-[var(--macos-surface)] flex items-center justify-between px-4",
            isMaximized && !showTopChrome ? "border-b-0" : "border-b border-[var(--macos-separator)]"
          )}
          animate={{ height: isMaximized ? (showTopChrome ? TITLE_BAR_HEIGHT_PX : 0) : TITLE_BAR_HEIGHT_PX }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          style={{ overflow: 'hidden' }}
          onMouseEnter={() => isMaximized && onTitleBarHoverChange?.(true)}
          onMouseLeave={() => isMaximized && onTitleBarHoverChange?.(false)}
        >
          {/* Traffic Lights */}
          <div className="flex items-center space-x-2">
            <TrafficLight 
              color="red" 
              symbol="×"
              onClick={onClose} 
            />
            <TrafficLight 
              color="yellow" 
              symbol="−"
              onClick={handleMinimize} 
            />
            <TrafficLight 
              color="green" 
              symbol="+"
              onClick={handleMaximize} 
            />
          </div>

          {/* Title */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-sm font-medium text-[var(--macos-text-secondary)] select-none">
              {title}
            </span>
          </div>

          {/* Empty space for balance */}
          <div className="w-16" />
        </motion.div>

        {/* Content */}
        <div 
          className="h-full overflow-auto"
          style={{ height: isMaximized ? `calc(100% - ${showTopChrome ? TITLE_BAR_HEIGHT_PX : 0}px)` : `calc(100% - ${TITLE_BAR_HEIGHT_PX}px)` }}
        >
          {children}
        </div>

        {/* Resize handles */}
        {resizable && !isMaximized && (
          <>
            {/* Edges */}
            <div onMouseDown={(e) => handleStartResize('n', e)} className="absolute top-0 left-2 right-2 h-1.5 cursor-n-resize" />
            <div onMouseDown={(e) => handleStartResize('s', e)} className="absolute bottom-0 left-2 right-2 h-1.5 cursor-s-resize" />
            <div onMouseDown={(e) => handleStartResize('w', e)} className="absolute top-2 bottom-2 left-0 w-1.5 cursor-w-resize" />
            <div onMouseDown={(e) => handleStartResize('e', e)} className="absolute top-2 bottom-2 right-0 w-1.5 cursor-e-resize" />

            {/* Corners */}
            <div onMouseDown={(e) => handleStartResize('nw', e)} className="absolute top-0 left-0 w-3 h-3 cursor-nw-resize" />
            <div onMouseDown={(e) => handleStartResize('ne', e)} className="absolute top-0 right-0 w-3 h-3 cursor-ne-resize" />
            <div onMouseDown={(e) => handleStartResize('sw', e)} className="absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize" />
            <div onMouseDown={(e) => handleStartResize('se', e)} className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize" />
          </>
        )}
      </motion.div>
    </div>
  );
}
