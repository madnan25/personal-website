"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback, memo } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import DesktopWallpaper, { GradientBackground } from "./DesktopWallpaper";
import MenuBar from "./MenuBar";
import Dock from "./Dock";
import Window from "./Window";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import BlogTemplate from "@/components/blog/BlogTemplate";
import { blogPosts } from "@/lib/blog";
import { DockProvider, useDockContext } from "./DockContext";
// import { cn } from "@/lib/utils";
import { TerminalSquare, FileVideo, Calendar, Linkedin } from "lucide-react";
import MediaPlayer from "./MediaPlayer";
import DesktopShortcut from "./DesktopShortcut";
import VerticalIcon from "./icons/Vertical";

interface WindowState {
  id: string;
  title: string;
  component: React.ReactNode;
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
}

const MemoBlogWindow = memo(BlogWindow);

function MacOSDesktopInner({ initialSelectedBlogId, initialOpenWindow }: { initialSelectedBlogId?: string; initialOpenWindow?: 'blog' | 'about' | 'portfolio' | 'projects' | 'contact' | 'settings' | 'terminal' | 'media' | 'trash' }) {
  const router = useRouter();
  const pathname = usePathname();
  const [wallpaperSrc, setWallpaperSrc] = useState<string>("/luffy-neon.jpg");
  const [isAnyMaximized, setIsAnyMaximized] = useState<boolean>(false);
  const [isTopHover, setIsTopHover] = useState<boolean>(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const REVEAL_STRIP_HEIGHT_PX = 14; // increase hover activation area
  // Desktop shortcut positions (session memory)
  const [shortcutPositions, setShortcutPositions] = useState<{ [key: string]: { left: number; top: number } }>({
    "the-vertical": { left: 24, top: 80 },
    "voortgang": { left: 24, top: 210 },
    "nettaworks": { left: 24, top: 340 },
  });

  const updateShortcut = useCallback((id: string, pos: { left: number; top: number }) => {
    setShortcutPositions((s) => ({ ...s, [id]: pos }));
  }, []);

  // Window memory: persists while window is minimized, resets on close
  const [blogMemory, setBlogMemory] = useState<{ selectedId: string | null; scrollTopById: Record<string, number> }>({
    selectedId: initialSelectedBlogId ?? null,
    scrollTopById: {},
  });
  const [scrollMemory, setScrollMemory] = useState<Record<string, number>>({});
  const [terminalMemory, setTerminalMemory] = useState<{ history: string[]; input: string }>({
    history: ["Welcome to mdadnan ~ Terminal. Type 'help' to get started."],
    input: '',
  });
  const handleTerminalMemoryChange = useCallback((m: { history: string[]; input: string }) => {
    setTerminalMemory(m);
  }, []);
  // Removed unused per-window states in favor of shared scrollMemory and controlled renders

  const revealBars = () => {
    if (!isAnyMaximized) return;
    if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
    // Immediately show both bars together to prevent background flash
    setIsTopHover(true);
  };

  const hideBarsWithDelay = () => {
    if (!isAnyMaximized) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    // Hide both bars together with same timing
    hideTimerRef.current = setTimeout(() => setIsTopHover(false), 200);
  };
  const [windows, setWindows] = useState<WindowState[]>([
    {
      id: 'about',
      title: 'About Mohammad Dayem Adnan',
      isOpen: false,
      isMinimized: false,
      position: { x: 200, y: 100 },
      component: <AboutWindow />
    },
    {
      id: 'portfolio',
      title: 'Portfolio',
      isOpen: false,
      isMinimized: false,
      position: { x: 260, y: 140 },
      component: <PlaceholderWindow title="Portfolio" />
    },
    {
      id: 'projects',
      title: 'Projects',
      isOpen: false,
      isMinimized: false,
      position: { x: 220, y: 180 },
      component: <PlaceholderWindow title="Projects" />
    },
    {
      id: 'blog',
      title: 'Blog',
      isOpen: initialOpenWindow === 'blog' || Boolean(initialSelectedBlogId),
      isMinimized: false,
      position: { x: 180, y: 160 },
      component: null // rendered with controlled props below
    },
    {
      id: 'contact',
      title: 'Contact',
      isOpen: false,
      isMinimized: false,
      position: { x: 240, y: 120 },
      component: <PlaceholderWindow title="Contact" />
    },
    {
      id: 'settings',
      title: 'Settings',
      isOpen: false,
      isMinimized: false,
      position: { x: 80, y: 80 },
      component: <SettingsWindow onSetWallpaper={setWallpaperSrc} />
    }
    ,
    {
      id: 'trash',
      title: 'Trash',
      isOpen: false,
      isMinimized: false,
      position: { x: 140, y: 160 },
      component: <TrashWindow onOpenMedia={() => openWindowById('media')} />
    },
    {
      id: 'terminal',
      title: 'Terminal',
      isOpen: false,
      isMinimized: false,
      position: { x: 100, y: 120 },
      component: null
    },
    {
      id: 'media',
      title: 'QuickTime Player',
      isOpen: false,
      isMinimized: false,
      position: { x: 180, y: 140 },
      component: <MediaPlayer videoId="dQw4w9WgXcQ" />
    }
  ]);

  // Keep a live ref of windows for handlers used inside child components
  const windowsRef = useRef<WindowState[]>(windows);
  useEffect(() => {
    windowsRef.current = windows;
  }, [windows]);

  const handleDockItemClick = (itemId: string) => {
    openWindowById(itemId);
  };

  // Stable callbacks for Blog window to avoid re-render loops
  const handleBlogSelectedIdChange = useCallback((id: string | null) => {
    setBlogMemory(prev => ({ ...prev, selectedId: id }));
  }, []);
  // No scroll position tracking for blogs to keep scrolling buttery-smooth

  const openWindowById = (windowId: string) => {
    setWindows(prev => {
      const target = prev.find(w => w.id === windowId);
      if (!target) return prev;
      const others = prev.filter(w => w.id !== windowId);
      const updatedTarget = { ...target, isOpen: true, isMinimized: false };
      // Move opened window to end so it renders on top
      return [...others, updatedTarget];
    });
    // Immediately reflect in URL for key windows
    if (windowId === 'about') {
      router.push('/about', { scroll: false });
    } else if (windowId === 'blog') {
      const slug = blogMemory.selectedId;
      router.push(slug ? `/blog/${slug}` : '/blog', { scroll: false });
    }
  };

  const runCommand = (cmd: string) => {
    const trimmed = cmd.trim();
    const openMatch = /^open\s+(about|portfolio|projects|blog|contact|settings)$/i.exec(trimmed);
    if (openMatch) {
      const target = openMatch[1].toLowerCase();
      openWindowById(target);
      return `Opening ${target}...`;
    }
    const closeMatch = /^(?:exit|close)\s+(about|portfolio|projects|blog|contact|settings|terminal)$/i.exec(trimmed);
    if (closeMatch) {
      const target = closeMatch[1].toLowerCase();
      if (target === 'terminal') {
        return "__EXIT__";
      }
      const win = windowsRef.current.find(w => w.id === target);
      if (!win) {
        return `Unknown window: ${target}`;
      }
      // Consider minimized as open for closing semantics
      if (!win.isOpen && !win.isMinimized) {
        return `${target} is not open. Use 'open ${target}' to open it first.`;
      }
      handleWindowClose(target);
      return `Closing ${target}...`;
    }
    if (/^(exit|close)$/i.test(trimmed)) {
      return "__EXIT__";
    }
    if (/^help$/i.test(trimmed)) {
      return "Commands: help, clear, open <about|portfolio|projects|blog|contact|settings>, close <window>, exit <window>";
    }
    if (/^clear$/i.test(trimmed)) {
      return "__CLEAR__";
    }
    return `command not found: ${trimmed}`;
  };

  const { getEl, setMinimized } = useDockContext();

  const handleWindowClose = (windowId: string) => {
    setWindows(prev => 
      prev.map(window => 
        window.id === windowId 
          ? { ...window, isOpen: false, isMinimized: false }
          : window
      )
    );
    // Restore global UI when closing a full-screen window
    setIsAnyMaximized(false);
    setIsTopHover(false);
    // Clear memory only on hard close
    if (windowId === 'blog') {
      setBlogMemory({ selectedId: null, scrollTopById: {} });
      // When blog window is closed, navigate to root if currently under /blog
      if (typeof pathname === 'string' && pathname.startsWith('/blog')) {
        router.push('/', { scroll: false });
      }
    }
    if (windowId === 'about') {
      // When about window is closed, navigate to root if currently at /about
      if (typeof pathname === 'string' && pathname === '/about') {
        router.push('/', { scroll: false });
      }
    }
    setScrollMemory(prev => ({ ...prev, [windowId]: 0 }));
    if (windowId === 'terminal') {
      setTerminalMemory({ history: ["Welcome to mdadnan ~ Terminal. Type 'help' to get started."], input: '' });
    }
    const dock = document.querySelector('[data-role="macos-dock"]') as HTMLElement | null;
    if (dock) dock.style.zIndex = '50';
  };

  // Keep URL -> UI in sync (open corresponding window when its route is active).
  // Do not auto-close other windows here to avoid cross-closing behavior.
  useEffect(() => {
    if (typeof pathname !== 'string') return;
    if (pathname === '/about') {
      setWindows(prev => prev.map(w => w.id === 'about' ? { ...w, isOpen: true, isMinimized: false } : w));
      return;
    }
    if (pathname === '/blog') {
      setWindows(prev => prev.map(w => w.id === 'blog' ? { ...w, isOpen: true, isMinimized: false } : w));
      setBlogMemory(prev => ({ ...prev, selectedId: null }));
      return;
    }
    const match = pathname.match(/^\/blog\/(.+)$/);
    if (match) {
      const slug = match[1];
      setWindows(prev => prev.map(w => w.id === 'blog' ? { ...w, isOpen: true, isMinimized: false } : w));
      setBlogMemory(prev => ({ ...prev, selectedId: slug }));
      return;
    }
    // For other paths, do nothing; explicit close is handled by handleWindowClose.
  }, [pathname]);

  const handleWindowMinimize = (windowId: string) => {
    setWindows(prev => 
      prev.map(window => 
        window.id === windowId 
          ? { ...window, isMinimized: true }
          : window
      )
    );
    setMinimized(windows.filter(w => w.isMinimized || w.id === windowId).map(w => w.id));
    // If minimized from full-screen, bring back menu bar and dock
    setIsAnyMaximized(false);
    setIsTopHover(false);
    const dock = document.querySelector('[data-role="macos-dock"]') as HTMLElement | null;
    if (dock) dock.style.zIndex = '50';

    // Update URL if the minimized window owns the current URL
    const ownsUrl = (id: string) => {
      if (typeof pathname !== 'string') return false;
      if (id === 'blog') return pathname.startsWith('/blog');
      if (id === 'about') return pathname === '/about';
      return false;
    };
    if (ownsUrl(windowId)) {
      // No-op for blog now that we don't persist scroll position
      const blogOpen = windowsRef.current.find(w => w.id === 'blog' && w.isOpen && !w.isMinimized);
      const aboutOpen = windowsRef.current.find(w => w.id === 'about' && w.isOpen && !w.isMinimized);
      if (windowId === 'blog') {
        // Blog was minimized and owned the URL: clear slug by navigating to root (avoid auto-reopen)
        if (aboutOpen) {
          router.push('/about', { scroll: false });
        } else {
          router.push('/', { scroll: false });
        }
      } else if (windowId === 'about') {
        // About was minimized and owned the URL: prefer blog if active, else root
        if (blogOpen) {
          const slug = blogMemory.selectedId;
          router.push(slug ? `/blog/${slug}` : '/blog', { scroll: false });
        } else {
          router.push('/', { scroll: false });
        }
      } else {
        // Fallback to previous behavior
        if (blogOpen) {
          const slug = blogMemory.selectedId;
          router.push(slug ? `/blog/${slug}` : '/blog', { scroll: false });
        } else if (aboutOpen) {
          router.push('/about', { scroll: false });
        } else {
          router.push('/', { scroll: false });
        }
      }
    }
  };

  return (
    <div
      className="relative overflow-hidden"
      style={{
        // Use dynamic viewport units and safe-area to avoid cutoffs across iOS Safari and iPad
        width: '100svw',
        height: 'calc(100svh + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
      onContextMenu={(e) => {
        // Allow browser menu only when right-clicking the menu bar
        const target = e.target as HTMLElement;
        if (target.closest('[data-role="macos-menubar"]')) return;
        // Suppress default and show custom menu via event dispatch
        e.preventDefault();
        const evt = new CustomEvent('macos-desktop-context', { detail: { x: e.clientX, y: e.clientY } });
        window.dispatchEvent(evt);
      }}
    >
      {/* Desktop Wallpaper */}
      <DesktopWallpaper imageSrc={wallpaperSrc} imageAlt="Eagle flying over forest" />
      {/* Desktop Shortcuts - keep behind any windows */}
      <div className="absolute inset-0 z-[5] pointer-events-none">
        <DesktopShortcut
          icon={<VerticalIcon className="w-[60px] h-[60px]" />}
          label="The Vertical"
          left={shortcutPositions["the-vertical"].left}
          top={shortcutPositions["the-vertical"].top}
          onMove={(pos) => updateShortcut("the-vertical", pos)}
          onOpen={() => window.open("https://thevertical.pk", "_blank", "noopener,noreferrer")}
        />
        <DesktopShortcut
          icon={<Image src="/voortgang.png" alt="Voortgang logo" width={56} height={56} draggable={false} />}
          label="Voortgang"
          left={shortcutPositions["voortgang"].left}
          top={shortcutPositions["voortgang"].top}
          onMove={(pos) => updateShortcut("voortgang", pos)}
          onOpen={() => window.open("https://voortgang.io", "_blank", "noopener,noreferrer")}
        />
        <DesktopShortcut
          icon={<Image src="/nettaworks.png" alt="NettaWorks logo" width={46} height={46} draggable={false} />}
          label="NettaWorks"
          left={shortcutPositions["nettaworks"].left}
          top={shortcutPositions["nettaworks"].top}
          onMove={(pos) => updateShortcut("nettaworks", pos)}
          onOpen={() => window.open("https://nettaworks.com", "_blank", "noopener,noreferrer")}
        />
        <DesktopShortcut
          icon={<Image src="/discord.png" alt="Discord" width={48} height={48} draggable={false} />}
          label="Discord"
          left={shortcutPositions["discord"]?.left ?? 24}
          top={shortcutPositions["discord"]?.top ?? 470}
          onMove={(pos) => updateShortcut("discord", pos)}
          onOpen={() => window.open("https://discord.com/invite/dnrfSMgCvV", "_blank", "noopener,noreferrer")}
        />
      </div>
      
      {/* Menu Bar */}
      {/* Always-on hover reveal strip when any window is maximized */}
      {isAnyMaximized && !isTopHover && (
        <div 
          className="fixed top-0 left-0 right-0 z-[95]"
          style={{ height: REVEAL_STRIP_HEIGHT_PX }}
          onMouseEnter={revealBars}
        />
      )}

      <div 
        className="fixed inset-x-0 top-0 z-[90]"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div data-role="macos-menubar">
          <MenuBar hidden={isAnyMaximized && !isTopHover} onMouseLeave={hideBarsWithDelay} onOpenWindow={(id) => openWindowById(id)} />
        </div>
      </div>
      
      {/* Windows */}
      {windows.map(window => 
        window.isOpen && !window.isMinimized && (
          <Window
            key={window.id}
            title={window.title}
            initialPosition={window.position}
            onClose={() => handleWindowClose(window.id)}
            onMinimize={() => handleWindowMinimize(window.id)}
            onMaximize={(isMax) => {
              // When window is maximized, push Dock behind; when unmaximized, restore
              const dock = document.querySelector('[data-role="macos-dock"]') as HTMLElement | null;
              if (dock) dock.style.zIndex = isMax ? '10' : '50';
              setIsAnyMaximized(isMax);
              if (!isMax) setIsTopHover(false);
            }}
            minimizeTargetEl={getEl(window.id) ?? undefined}
            showTopChrome={!isAnyMaximized || isTopHover}
            topOffsetPx={32}
            onTitleBarHoverChange={(hover) => {
              if (!isAnyMaximized) return;
              if (hover) {
                if (hideTimerRef.current) { clearTimeout(hideTimerRef.current); hideTimerRef.current = null; }
                setIsTopHover(true);
              } else {
                hideBarsWithDelay();
              }
            }}
            onFocus={() => {
              setWindows(prev => {
                const target = prev.find(w => w.id === window.id);
                if (!target) return prev;
                const others = prev.filter(w => w.id !== window.id);
                return [...others, target];
              });
              // Reflect focused window in URL
              if (window.id === 'about') {
                router.push('/about', { scroll: false });
              } else if (window.id === 'blog') {
                const slug = blogMemory.selectedId;
                router.push(slug ? `/blog/${slug}` : '/blog', { scroll: false });
              }
            }}
          >
            {window.id === 'blog' ? (
              <MemoBlogWindow 
                selectedId={blogMemory.selectedId}
                onSelectedIdChange={handleBlogSelectedIdChange}
                scrollTop={0}
                onScrollTopChange={() => { /* no-op to avoid state churn during scroll */ }}
              />
            ) : window.id === 'about' ? (
              <AboutWindow 
                initialScrollTop={scrollMemory['about'] ?? 0}
                onScrollTopChange={(t) => setScrollMemory(prev => ({ ...prev, about: t }))}
                onOpenWindow={(id) => openWindowById(id)}
              />
            ) : window.id === 'settings' ? (
              <SettingsWindow 
                onSetWallpaper={setWallpaperSrc}
                initialScrollTop={scrollMemory['settings'] ?? 0}
                onScrollTopChange={(t) => setScrollMemory(prev => ({ ...prev, settings: t }))}
              />
            ) : window.id === 'portfolio' ? (
              <PlaceholderWindow 
                title="Portfolio"
                initialScrollTop={scrollMemory['portfolio'] ?? 0}
                onScrollTopChange={(t) => setScrollMemory(prev => ({ ...prev, portfolio: t }))}
              />
            ) : window.id === 'projects' ? (
              <PlaceholderWindow 
                title="Projects"
                initialScrollTop={scrollMemory['projects'] ?? 0}
                onScrollTopChange={(t) => setScrollMemory(prev => ({ ...prev, projects: t }))}
              />
            ) : window.id === 'contact' ? (
              <ContactWindow 
                initialScrollTop={scrollMemory['contact'] ?? 0}
                onScrollTopChange={(t) => setScrollMemory(prev => ({ ...prev, contact: t }))}
              />
            ) : window.id === 'terminal' ? (
              <TerminalWindow 
                onRunCommand={(cmd) => runCommand(cmd)} 
                onRequestClose={() => handleWindowClose('terminal')}
                initialScrollTop={scrollMemory['terminal'] ?? 0}
                onScrollTopChange={(t) => setScrollMemory(prev => ({ ...prev, terminal: t }))}
                initialHistory={terminalMemory.history}
                initialInput={terminalMemory.input}
                onMemoryChange={handleTerminalMemoryChange}
              />
            ) : (
              window.component
            )}
          </Window>
        )
      )}
      
      {/* Dock */}
      <Dock 
        onItemClick={handleDockItemClick}
        minimizedIds={windows.filter(w => w.isOpen || w.isMinimized).map(w => w.id)}
        hidden={isAnyMaximized}
      />

      {/* Custom context menu */}
      <DesktopContextMenu 
        onGetInfo={() => openWindowById('about')} 
        onChangeWallpaper={() => openWindowById('settings')} 
        onOpenTerminal={() => openWindowById('terminal')} 
      />
    </div>
  );
}

export default function MacOSDesktop({ initialSelectedBlogId, initialOpenWindow }: { initialSelectedBlogId?: string; initialOpenWindow?: 'blog' | 'about' | 'portfolio' | 'projects' | 'contact' | 'settings' | 'terminal' | 'media' | 'trash' }) {
  return (
    <DockProvider>
      <MacOSDesktopInner initialSelectedBlogId={initialSelectedBlogId} initialOpenWindow={initialOpenWindow} />
    </DockProvider>
  );
}

// Desktop right-click context menu
function DesktopContextMenu({ onGetInfo, onChangeWallpaper, onOpenTerminal }: { onGetInfo: () => void; onChangeWallpaper: () => void; onOpenTerminal: () => void }) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  useEffect(() => {
    const show = (e: Event) => {
      const detail = (e as CustomEvent).detail as { x: number; y: number } | undefined;
      if (!detail) return;
      setPos(detail);
      setVisible(true);
    };
    const hide = () => setVisible(false);
    window.addEventListener('macos-desktop-context', show as EventListener);
    window.addEventListener('click', hide);
    window.addEventListener('scroll', hide, true);
    return () => {
      window.removeEventListener('macos-desktop-context', show as EventListener);
      window.removeEventListener('click', hide);
      window.removeEventListener('scroll', hide, true);
    };
  }, []);
  if (!visible) return null;
  return (
    <div
      className="fixed z-[200] min-w-[220px] rounded-lg border border-[var(--macos-border)] bg-[var(--macos-surface-elevated)] backdrop-blur-xl shadow-2xl py-2"
      style={{ left: pos.x + 4, top: pos.y + 4 }}
      role="menu"
    >
      <button
        className="w-full text-left px-3 py-2 text-[13px] macos-hover text-[var(--macos-text-primary)]"
        onClick={() => { onGetInfo(); setVisible(false); }}
      >
        Get Info
      </button>
      <button
        className="w-full text-left px-3 py-2 text-[13px] macos-hover text-[var(--macos-text-primary)]"
        onClick={() => { onChangeWallpaper(); setVisible(false); }}
      >
        Change Wallpaper…
      </button>
      <div className="my-2 h-px bg-[var(--macos-separator)]" />
      <button
        className="w-full text-left px-3 py-2 text-[13px] macos-hover text-[var(--macos-text-primary)]"
        onClick={() => { onOpenTerminal(); setVisible(false); }}
      >
        Open Terminal
      </button>
    </div>
  );
}

// About Window Content Component
function AboutWindow({ initialScrollTop = 0, onScrollTopChange, onOpenWindow }: { initialScrollTop?: number; onScrollTopChange?: (t: number) => void; onOpenWindow?: (id: string) => void; }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const posterRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const scaleMv = useMotionValue(1);
  const glareX = useMotionValue(0);
  const glareY = useMotionValue(0);
  const rotateX = useSpring(tiltX, { stiffness: 250, damping: 20 });
  const rotateY = useSpring(tiltY, { stiffness: 250, damping: 20 });
  const scale = useSpring(scaleMv, { stiffness: 250, damping: 20 });
  const hx = useSpring(glareX, { stiffness: 250, damping: 20 });
  const hy = useSpring(glareY, { stiffness: 250, damping: 20 });
  const opacity = useTransform(scale, s => s > 1 ? 0.25 : 0);
  const shadow = useTransform(scale, s => s > 1 ? "0 35px 80px rgba(0,0,0,0.45)" : "0 12px 24px rgba(0,0,0,0.25)");
  const handlePosterMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Guard: Only animate on hover-capable pointers and if user doesn't prefer reduced motion
    if (prefersReducedMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const rect = posterRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const px = (x / rect.width) * 2 - 1;
    const py = (y / rect.height) * 2 - 1;
    const intensity = Math.min(1, Math.hypot(px, py));
    const max = 16;
    tiltY.set(px * max);
    tiltX.set(-py * max);
    scaleMv.set(Math.min(1.08, 1.05 + 0.03 * intensity));
    glareX.set(px * 12);
    glareY.set(py * 12);
  }, [glareX, glareY, prefersReducedMotion, scaleMv, tiltX, tiltY]);
  const handlePosterLeave = useCallback(() => {
    tiltX.set(0);
    tiltY.set(0);
    scaleMv.set(1);
    glareX.set(0);
    glareY.set(0);
  }, [glareX, glareY, scaleMv, tiltX, tiltY]);
  useLayoutEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = initialScrollTop;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div ref={containerRef} className="p-8 h-full overflow-auto" onScroll={(e) => onScrollTopChange?.((e.target as HTMLDivElement).scrollTop)}>
      <motion.div className="max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-6 [perspective:800px]">
            <motion.div
              ref={posterRef}
              className="inline-block"
              onMouseMove={handlePosterMove}
              onMouseLeave={handlePosterLeave}
              style={prefersReducedMotion ? { transformStyle: "preserve-3d", rotateX: 0, rotateY: 0, scale: 1, boxShadow: "0 12px 24px rgba(0,0,0,0.25)" } : { transformStyle: "preserve-3d", rotateX, rotateY, scale, boxShadow: shadow }}
            >
              <div className="relative">
                <Image
                  src="/Wanted-Poster.png"
                  alt="Wanted poster of Mohammad Dayem Adnan"
                  width={320}
                  height={400}
                  priority
                  className="w-40 h-auto rounded-lg shadow-lg will-change-transform"
                />
                <motion.div
                  className="pointer-events-none absolute inset-0 rounded-lg"
                  style={prefersReducedMotion ? { background: "linear-gradient(120deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 40%)", opacity: 0 } : { background: "linear-gradient(120deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 40%)", opacity, x: hx, y: hy }}
                />
              </div>
            </motion.div>
          </div>
          
          <motion.h1 className="text-4xl font-light text-[var(--macos-text-primary)] mb-3 shine-text">
            Mohammad Dayem Adnan
          </motion.h1>
          
          <motion.p className="text-xl text-[var(--macos-text-secondary)] mb-4">
            I build teams, products, and repeatable wins.
          </motion.p>

          <motion.div className="flex flex-wrap gap-2 mb-8">
                  {['CMO', 'Founder', 'Head of Delivery'].map((role) => (
              <span 
                key={role}
                className="px-3 py-1 bg-[var(--macos-accent)]/10 text-[var(--macos-accent)] rounded-full text-sm font-medium border border-[var(--macos-accent)]/20"
              >
                {role}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Content */}
        <motion.div className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--macos-accent)] mb-2">
              About me
            </h2>
            <div className="h-[2px] w-12 bg-[var(--macos-accent)] rounded-full mb-3" />
            <p className="text-lg leading-relaxed text-[var(--macos-text-secondary)] mb-4">
              I’m a builder who loves turning ideas into working systems—brands that resonate, products people use, and campaigns that actually pay for themselves. I’ve managed $1.2M/year in marketing budgets and shipped programs that turn $30k into $2.6M in revenue (~86× ROAS).
            </p>
            <p className="text-lg leading-relaxed text-[var(--macos-text-secondary)]">
              Right now I wear three hats: CMO at The Vertical, Founder at Voortgang, and Head of Delivery at NettaWorks. I’m happiest when I’m building—applying design thinking, ruthless prioritization, and tight feedback loops to deliver results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-[var(--macos-accent)] mb-4">Core Expertise</h3>
              <div className="space-y-2">
                {[
                  'Growth Marketing',
                  'UX/UI',
                  'Product Design',
                  'Product Management',
                  'Team Leadership & Org Design',
                ].map((item) => (
                  <div key={item} className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-[var(--macos-accent)]" />
                    <span className="text-[var(--macos-text-secondary)]">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold text-[var(--macos-accent)] mb-4">Current Focus</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <span className="text-lg">🏔️</span>
                  <div>
                    <div className="font-medium text-[var(--macos-text-primary)]">Chief Marketing Officer, The Vertical</div>
                    <div className="text-sm text-[var(--macos-text-secondary)]">Scaling brand equity and pipeline</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-lg">🧰</span>
                  <div>
                    <div className="font-medium text-[var(--macos-text-primary)]">Founder, Voortgang</div>
                    <div className="text-sm text-[var(--macos-text-secondary)]">Building practical, innovative tools and experiences</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-lg">🚀</span>
                  <div>
                    <div className="font-medium text-[var(--macos-text-primary)]">Head of Delivery, NettaWorks</div>
                    <div className="text-sm text-[var(--macos-text-secondary)]">Getting complex projects over the line, cleanly</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-[var(--macos-accent)] mb-4">Selected Wins</h3>
            <div className="space-y-2">
              {[
                '$1.2M annual budget managed across brand, performance, and content',
                '$30k → $2.6M campaign outcome (~86× ROAS) with disciplined creative + media ops',
                'Best Real Estate Brand — helped The Vertical win at Global Digital Awards',
              ].map((item) => (
                <div key={item} className="flex items-center space-x-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--macos-accent)]" />
                  <span className="text-[var(--macos-text-secondary)]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-[var(--macos-accent)] mb-4">Advisory & Community</h3>
            <p className="text-[var(--macos-text-secondary)]">
              Board of Advisors, Pakistan Ecommerce Association — supporting practical growth and standards for the ecosystem.
            </p>
          </div>

          {/* Call to Action */}
          <div className="pt-6 border-t border-[var(--macos-separator)]">
            <div className="flex flex-wrap gap-3">
              <motion.button
                className="px-6 py-3 bg-[var(--macos-accent)] text-white rounded-lg font-medium hover:bg-[var(--macos-accent-hover)] transition-colors duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenWindow?.('projects')}
              >
                View Projects
              </motion.button>
              <motion.button
                className="px-6 py-3 border border-[var(--macos-border)] text-[var(--macos-text-primary)] rounded-lg font-medium hover:bg-[var(--macos-surface)] transition-colors duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOpenWindow?.('contact')}
              >
                Get in Touch
              </motion.button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function SettingsWindow({ onSetWallpaper, initialScrollTop = 0, onScrollTopChange }: { onSetWallpaper: (src: string) => void; initialScrollTop?: number; onScrollTopChange?: (t: number) => void; }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = initialScrollTop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const wallpapers = [
    { src: "/luffy-neon.jpg", label: "Neon Luffy" },
    { src: "/eagle-forest.jpg", label: "Eagle Forest" },
    { src: "gradient:big-sur", label: "Gradient – Big Sur" },
    { src: "gradient:monterey", label: "Gradient – Monterey" },
    { src: "gradient:sonoma", label: "Gradient – Sonoma" },
  ];
  return (
    <div ref={containerRef} className="p-4 h-full overflow-auto" onScroll={(e) => onScrollTopChange?.((e.target as HTMLDivElement).scrollTop)}>
      <div className="space-y-4">
        <div>
          <div className="text-sm font-medium mb-2">Wallpaper</div>
              <div className="grid grid-cols-2 gap-3">
            {wallpapers.map((wp) => (
              <button
                key={wp.label}
                onClick={() => onSetWallpaper(wp.src)}
                className="rounded-lg overflow-hidden border border-[var(--macos-border)] hover:border-[var(--macos-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--macos-accent)]"
              >
                    <div className="h-24 w-full relative">
                      {wp.src.startsWith('gradient:') ? (
                        <div className="absolute inset-0">
                          <GradientBackground id={wp.src.replace('gradient:', '')} />
                        </div>
                      ) : (
                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${wp.src})` }} />
                      )}
                    </div>
                <div className="text-xs p-2 text-left">{wp.label}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaceholderWindow({ title, initialScrollTop = 0, onScrollTopChange }: { title: string; initialScrollTop?: number; onScrollTopChange?: (t: number) => void; }) {
  const containerRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = initialScrollTop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div ref={containerRef} className="p-6 h-full overflow-auto" onScroll={(e) => onScrollTopChange?.((e.target as HTMLDivElement).scrollTop)}>
      <div className="text-lg font-medium mb-2">{title}</div>
      <div className="text-sm text-[var(--macos-text-secondary)]">Coming soon.</div>
    </div>
  );
}

function ContactWindow({ initialScrollTop = 0, onScrollTopChange }: { initialScrollTop?: number; onScrollTopChange?: (t: number) => void; }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<{ name: string; email: string; phone: string; subject: 'speaking' | 'work' | 'other'; message: string }>({ name: '', email: '', phone: '', subject: 'speaking', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  useLayoutEffect(() => {
    if (containerRef.current) containerRef.current.scrollTop = initialScrollTop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Load and render Cloudflare Turnstile widget
  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) return;
    type TurnstileAPI = { render: (el: Element, opts: Record<string, unknown>) => string | undefined; reset: (id?: string) => void };
    const getAPI = (): TurnstileAPI | undefined => (window as unknown as { turnstile?: TurnstileAPI }).turnstile;
    const renderWidget = () => {
      const api = getAPI();
      if (!api || !widgetContainerRef.current) return;
      if (widgetIdRef.current) api.reset(widgetIdRef.current);
      widgetIdRef.current = api.render(widgetContainerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => setTurnstileToken(token),
        'error-callback': () => setTurnstileToken(''),
        'expired-callback': () => setTurnstileToken(''),
      });
    };
    if (getAPI()) {
      renderWidget();
      return;
    }
    let script = document.getElementById('cf-turnstile') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'cf-turnstile';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    } else {
      script.addEventListener('load', renderWidget, { once: true });
    }
  }, []);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    if (!turnstileToken) {
      setResult({ ok: false, message: 'Please complete the verification.' });
      return;
    }
    setIsSubmitting(true);
    setResult(null);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, turnstileToken })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ ok: false, message: data.error || 'Something went wrong. Please try again.' });
      } else {
        setResult({ ok: true, message: 'Thanks! Your message has been sent.' });
        setForm({ name: '', email: '', phone: '', subject: 'speaking', message: '' });
        setTurnstileToken('');
      }
    } catch {
      setResult({ ok: false, message: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
      // Always reset the widget so a fresh token is required for the next submit
      try {
        const api = (window as unknown as { turnstile?: { reset: (id?: string) => void } }).turnstile;
        api?.reset(widgetIdRef.current);
      } catch {}
      setTurnstileToken('');
    }
  };
  return (
    <div ref={containerRef} className="p-6 h-full overflow-auto" onScroll={(e) => onScrollTopChange?.((e.target as HTMLDivElement).scrollTop)}>
      <div className="max-w-2xl">
        <div className="mb-6">
          <div className="text-lg font-medium text-[var(--macos-text-primary)]">Get in touch</div>
          <div className="text-sm text-[var(--macos-text-secondary)]">I usually reply within a day.</div>
        </div>

        {result && (
          <div className={`mb-4 text-sm rounded-md border px-3 py-2 ${result.ok ? 'border-teal-500/40 text-teal-600 bg-teal-500/5' : 'border-red-500/40 text-red-600 bg-red-500/5'}`}>{result.message}</div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="contact-name" className="text-sm text-[var(--macos-text-secondary)]">Name<span className="text-red-500">*</span></label>
              <input id="contact-name" name="name" required placeholder="Your name" value={form.name} onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))} disabled={isSubmitting} className="px-3 py-2 rounded-md border border-[var(--macos-border)] bg-[var(--macos-surface)] text-[var(--macos-text-primary)] placeholder:text-[var(--macos-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--macos-accent)] disabled:opacity-50" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="contact-email" className="text-sm text-[var(--macos-text-secondary)]">Email<span className="text-red-500">*</span></label>
              <input id="contact-email" name="email" type="email" required placeholder="you@example.com" value={form.email} onChange={(e) => setForm(s => ({ ...s, email: e.target.value }))} disabled={isSubmitting} className="px-3 py-2 rounded-md border border-[var(--macos-border)] bg-[var(--macos-surface)] text-[var(--macos-text-primary)] placeholder:text-[var(--macos-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--macos-accent)] disabled:opacity-50" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="contact-phone" className="text-sm text-[var(--macos-text-secondary)]">Phone (optional)</label>
              <input id="contact-phone" name="phone" type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={(e) => setForm(s => ({ ...s, phone: e.target.value }))} disabled={isSubmitting} className="px-3 py-2 rounded-md border border-[var(--macos-border)] bg-[var(--macos-surface)] text-[var(--macos-text-primary)] placeholder:text-[var(--macos-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--macos-accent)] disabled:opacity-50" />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="contact-subject" className="text-sm text-[var(--macos-text-secondary)]">Subject</label>
              <select id="contact-subject" name="subject" value={form.subject} onChange={(e) => setForm(s => ({ ...s, subject: e.target.value as 'speaking' | 'work' | 'other' }))} disabled={isSubmitting} className="px-3 py-2 rounded-md border border-[var(--macos-border)] bg-[var(--macos-surface)] text-[var(--macos-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--macos-accent)] disabled:opacity-50">
                <option value="speaking">Speaking engagement</option>
                <option value="work">Work with me</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="contact-message" className="text-sm text-[var(--macos-text-secondary)]">Message</label>
            <textarea id="contact-message" name="message" rows={6} placeholder="Share a few details about your request..." value={form.message} onChange={(e) => setForm(s => ({ ...s, message: e.target.value }))} disabled={isSubmitting} className="px-3 py-2 rounded-md border border-[var(--macos-border)] bg-[var(--macos-surface)] text-[var(--macos-text-primary)] placeholder:text-[var(--macos-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--macos-accent)] disabled:opacity-50" />
          </div>

          <div className="flex items-center justify-end pt-2">
            <div className="flex-1" />
            <div ref={widgetContainerRef} className="mr-3" aria-hidden={false} />
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-[var(--macos-accent)] text-white rounded-md font-medium hover:bg-[var(--macos-accent-hover)] transition-colors disabled:opacity-50">{isSubmitting ? 'Sending…' : 'Send'}</button>
          </div>

          <div className="my-4 border-t border-[var(--macos-separator)]" />

          <div className="flex flex-wrap gap-3 items-center">
            <div className="text-xs text-[var(--macos-text-secondary)] mr-1">Other ways</div>
            <a href="https://cal.com/madnan" target="_blank" rel="noopener noreferrer" aria-label="Book a meeting on Cal.com" className="p-2 rounded-md border border-[var(--macos-border)] macos-hover flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Book A Meeting</span>
            </a>
            <a href="https://www.linkedin.com/in/mdayemadnan/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile" className="p-2 rounded-md border border-[var(--macos-border)] macos-hover flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              <span className="text-sm">LinkedIn</span>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

function BlogWindow({ selectedId, onSelectedIdChange, scrollTop, onScrollTopChange }: { selectedId: string | null; onSelectedIdChange: (id: string | null) => void; scrollTop: number; onScrollTopChange: (t: number) => void; }) {
  const router = useRouter();
  const selected = blogPosts.find((p) => p.id === selectedId) ?? null;
  const mainRef = useRef<HTMLDivElement>(null);
  const isRestoringRef = useRef<boolean>(false);
  const onScrollTopChangeRef = useRef(onScrollTopChange);
  useEffect(() => { onScrollTopChangeRef.current = onScrollTopChange; }, [onScrollTopChange]);
  const userScrolledRef = useRef<boolean>(false);
  // Removed scroll persistence; keep minimal refs only
  const [dynamicBlocks, setDynamicBlocks] = useState<typeof selected | null>(null);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);
  const [blocksError, setBlocksError] = useState<string | null>(null);
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = scrollTop || 0;
    }
    // run only on mount to restore position
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Persist latest scroll position on unmount (e.g., when minimizing)
  useEffect(() => {
    const refAtMount = mainRef.current;
    return () => {
      if (refAtMount) {
        onScrollTopChangeRef.current(refAtMount.scrollTop || 0);
      }
    };
  }, []);
  // Dynamically import per-post blocks for file-backed posts (no inline content)
  useEffect(() => {
    let cancelled = false;
    setDynamicBlocks(null);
    setBlocksError(null);
    if (!selected || (selected.content && selected.content.length > 0)) return;
    setIsLoadingBlocks(true);
    ;(async () => {
      try {
        if (selected.id === 'in-defense-of-bubbles') {
          const mod = await import('@/lib/posts/in-defense-of-bubbles');
          if (!cancelled) setDynamicBlocks({ ...selected, content: mod.content });
        } else if (selected.id === 'build-things-that-matter') {
          const mod = await import('@/lib/posts/build-things-that-matter');
          if (!cancelled) setDynamicBlocks({ ...selected, content: mod.content });
        }
      } catch {
        if (!cancelled) setBlocksError('Failed to load article');
      } finally {
        if (!cancelled) setIsLoadingBlocks(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selected]);

  // Always start at top for a fresh, smooth experience
  useLayoutEffect(() => {
    if (!mainRef.current) return;
    mainRef.current.scrollTop = 0;
  }, [selectedId, dynamicBlocks]);
  // Extra guard: if DOM height changes right after mount, re-apply once
  useEffect(() => {
    if (!mainRef.current) return;
    if (scrollTop > 0 && Math.abs(mainRef.current.scrollTop - scrollTop) > 2) {
      const id = requestAnimationFrame(() => {
        if (mainRef.current) mainRef.current.scrollTop = scrollTop;
      });
      return () => cancelAnimationFrame(id);
    }
  }, [scrollTop]);
  // Passive scroll listener with rAF batching to avoid frequent state updates
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    let ticking = false;
    const handle = () => {
      if (isRestoringRef.current) return;
      if (!userScrolledRef.current) userScrolledRef.current = true;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          // no-op: we don't propagate scroll during scroll to keep it smooth
          ticking = false;
        });
      }
    };
    el.addEventListener('scroll', handle, { passive: true });
    // Keep layer simple to reduce text shimmer
    el.style.contain = 'paint';
    return () => {
      el.removeEventListener('scroll', handle as EventListener);
      el.style.contain = '';
    };
  }, []);
  return (
    <div className="h-full flex">
      <aside className="w-64 border-r border-[var(--macos-border)] p-4 space-y-3 overflow-auto">
        <div className="text-sm font-medium text-[var(--macos-text-secondary)] mb-1">Posts</div>
        {blogPosts.map((post) => {
          const isActive = post.id === selectedId;
          return (
            <button
              key={post.id}
              onClick={() => {
                if (isActive) {
                  onSelectedIdChange(null);
                  router.push('/blog', { scroll: false });
                } else {
                  onSelectedIdChange(post.id);
                  router.push(`/blog/${post.id}`, { scroll: false });
                }
              }}
              className={`w-full text-left rounded-md p-3 transition-colors ${
                isActive
                  ? 'bg-[var(--macos-accent)]/10 border border-[var(--macos-accent)]/30'
                  : 'macos-hover-bordered border'
              }`}
            >
              <div className="text-sm font-medium text-[var(--macos-text-primary)]">{post.title}</div>
              <div className="text-xs text-[var(--macos-text-secondary)] truncate">{post.description}</div>
            </button>
          );
        })}
      </aside>
      <main
        ref={mainRef}
        className="flex-1 p-6 overflow-auto"
      >
        {!selected ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-[var(--macos-text-secondary)]">
              <div className="text-xl mb-2">Select a post to read</div>
              <div className="text-sm">Choose from the list on the left.</div>
            </div>
          </div>
        ) : selected.content && selected.content.length > 0 ? (
          <BlogTemplate post={selected} />
        ) : isLoadingBlocks ? (
          <div className="text-[var(--macos-text-secondary)]">Loading…</div>
        ) : blocksError ? (
          <div className="text-red-500">{blocksError}</div>
        ) : dynamicBlocks ? (
          <BlogTemplate post={dynamicBlocks} />
        ) : null}
      </main>
    </div>
  );
}

function TerminalWindow({ onRunCommand, onRequestClose, initialScrollTop = 0, onScrollTopChange, initialHistory, initialInput, onMemoryChange }: { onRunCommand: (cmd: string) => string; onRequestClose?: () => void; initialScrollTop?: number; onScrollTopChange?: (t: number) => void; initialHistory: string[]; initialInput: string; onMemoryChange: (m: { history: string[]; input: string }) => void; }) {
  const [history, setHistory] = useState<string[]>(initialHistory);
  const [input, setInput] = useState<string>(initialInput);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const result = onRunCommand(input);
    if (result === "__CLEAR__") {
      setHistory([]);
    } else if (result === "__EXIT__") {
      onRequestClose?.();
    } else {
      setHistory((prev) => [...prev, `$ ${input}`, result]);
    }
    setInput("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = initialScrollTop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onMemoryChange({ history, input });
    // We intentionally avoid depending on the callback reference to prevent loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, input]);

  return (
    <div className="h-full bg-black text-green-200 font-mono text-sm">
      <div className="h-full flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-auto p-3 space-y-1" onScroll={(e) => onScrollTopChange?.((e.target as HTMLDivElement).scrollTop)}>
          {history.map((line, idx) => (
            <div key={idx} className="whitespace-pre-wrap">{line}</div>
          ))}
        </div>
        <form onSubmit={handleSubmit} className="border-t border-white/10">
          <div className="flex items-center gap-2 p-2">
            <span className="text-green-400"><TerminalSquare className="inline w-4 h-4 mr-1" /> mdadnan ~ %</span>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent outline-none text-green-200 placeholder:text-green-800"
              placeholder="Type a command... (e.g., open about)"
              autoFocus
            />
          </div>
        </form>
      </div>
    </div>
  );
}

function TrashWindow({ onOpenMedia }: { onOpenMedia: () => void }) {
  return (
    <div className="h-full p-4">
      <div className="text-sm text-[var(--macos-text-secondary)] mb-3">Recently Deleted</div>
      <div className="rounded-md border border-[var(--macos-border)] overflow-hidden">
        <button
          onClick={onOpenMedia}
          className="w-full flex items-center justify-between px-4 py-3 text-left macos-hover transition-colors"
        >
          <div className="flex items-center gap-3">
            <FileVideo className="w-5 h-5 text-[var(--macos-text-secondary)]" />
            <div>
              <div className="text-[var(--macos-text-primary)]">naughty video</div>
              <div className="text-xs text-[var(--macos-text-secondary)]">MP4 · 3:33</div>
            </div>
          </div>
          <div className="text-xs text-[var(--macos-text-secondary)]">Today</div>
        </button>
      </div>
      <div className="mt-3 text-xs text-[var(--macos-text-tertiary)]">Click the file to open.</div>
    </div>
  );
}

// MediaPlayerWindow removed in favor of reusable MediaPlayer component

