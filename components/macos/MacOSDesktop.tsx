"use client";

import { useEffect, useLayoutEffect, useRef, useState, useCallback } from "react";
import DesktopWallpaper, { GradientBackground } from "./DesktopWallpaper";
import MenuBar from "./MenuBar";
import Dock from "./Dock";
import Window from "./Window";
import { motion } from "framer-motion";
import { User as UserIcon } from "lucide-react";
import BlogTemplate from "@/components/blog/BlogTemplate";
import { blogPosts } from "@/lib/blog";
import { DockProvider, useDockContext } from "./DockContext";
// import { cn } from "@/lib/utils";
import { TerminalSquare, FileVideo } from "lucide-react";
import MediaPlayer from "./MediaPlayer";

interface WindowState {
  id: string;
  title: string;
  component: React.ReactNode;
  isOpen: boolean;
  isMinimized: boolean;
  position: { x: number; y: number };
}

function MacOSDesktopInner() {
  const [wallpaperSrc, setWallpaperSrc] = useState<string>("/luffy-neon.jpg");
  const [isAnyMaximized, setIsAnyMaximized] = useState<boolean>(false);
  const [isTopHover, setIsTopHover] = useState<boolean>(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const REVEAL_STRIP_HEIGHT_PX = 14; // increase hover activation area

  // Window memory: persists while window is minimized, resets on close
  const [blogMemory, setBlogMemory] = useState<{ selectedId: string | null; scrollTop: number }>({
    selectedId: null,
    scrollTop: 0,
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
    setIsTopHover(true);
  };

  const hideBarsWithDelay = () => {
    if (!isAnyMaximized) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setIsTopHover(false), 250);
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
      isOpen: false,
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
    setWindows(prev => prev.map(w => ({
      ...w,
      isOpen: w.id === itemId ? true : w.isOpen,
      isMinimized: w.id === itemId ? false : w.isMinimized,
    })));
  };

  const openWindowById = (windowId: string) => {
    setWindows(prev => {
      const target = prev.find(w => w.id === windowId);
      if (!target) return prev;
      const others = prev.filter(w => w.id !== windowId);
      const updatedTarget = { ...target, isOpen: true, isMinimized: false };
      // Move opened window to end so it renders on top
      return [...others, updatedTarget];
    });
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
      setBlogMemory({ selectedId: null, scrollTop: 0 });
    }
    setScrollMemory(prev => ({ ...prev, [windowId]: 0 }));
    if (windowId === 'terminal') {
      setTerminalMemory({ history: ["Welcome to mdadnan ~ Terminal. Type 'help' to get started."], input: '' });
    }
    const dock = document.querySelector('[data-role="macos-dock"]') as HTMLElement | null;
    if (dock) dock.style.zIndex = '50';
  };

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
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Desktop Wallpaper */}
      <DesktopWallpaper imageSrc={wallpaperSrc} imageAlt="Eagle flying over forest" />
      
      {/* Menu Bar */}
      {/* Always-on hover reveal strip when any window is maximized */}
      {isAnyMaximized && !isTopHover && (
        <div 
          className="fixed top-0 left-0 right-0 z-[70]"
          style={{ height: REVEAL_STRIP_HEIGHT_PX }}
          onMouseEnter={revealBars}
        />
      )}

      <div 
        className="fixed inset-x-0 top-0 z-[60]"
      >
        <MenuBar hidden={isAnyMaximized && !isTopHover} onMouseLeave={hideBarsWithDelay} onOpenWindow={(id) => openWindowById(id)} />
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
            }}
          >
            {window.id === 'blog' ? (
              <BlogWindow 
                selectedId={blogMemory.selectedId}
                onSelectedIdChange={(id) => setBlogMemory(prev => ({ ...prev, selectedId: id }))}
                scrollTop={blogMemory.scrollTop}
                onScrollTopChange={(t) => setBlogMemory(prev => ({ ...prev, scrollTop: t }))}
              />
            ) : window.id === 'about' ? (
              <AboutWindow 
                initialScrollTop={scrollMemory['about'] ?? 0}
                onScrollTopChange={(t) => setScrollMemory(prev => ({ ...prev, about: t }))}
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
              <PlaceholderWindow 
                title="Contact"
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
    </div>
  );
}

export default function MacOSDesktop() {
  return (
    <DockProvider>
      <MacOSDesktopInner />
    </DockProvider>
  );
}

// About Window Content Component
function AboutWindow({ initialScrollTop = 0, onScrollTopChange }: { initialScrollTop?: number; onScrollTopChange?: (t: number) => void; }) {
  const containerRef = useRef<HTMLDivElement>(null);
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
          <motion.div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6 flex items-center justify-center">
            <UserIcon className="w-12 h-12 text-white" />
          </motion.div>
          
          <motion.h1 className="text-4xl font-light text-[var(--macos-text-primary)] mb-3">
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
            <h2 className="text-2xl font-semibold text-[var(--macos-text-primary)] mb-3">
              About me
            </h2>
            <p className="text-lg leading-relaxed text-[var(--macos-text-secondary)] mb-4">
              I’m a builder who loves turning ideas into working systems—brands that resonate, products people use, and campaigns that actually pay for themselves. I’ve managed $1.2M/year in marketing budgets and shipped programs that turn $30k into $2.6M in revenue (~86× ROAS).
            </p>
            <p className="text-lg leading-relaxed text-[var(--macos-text-secondary)]">
              Right now I wear three hats: CMO at The Vertical, Founder at Voortgang, and Head of Delivery at NettaWorks. I’m happiest when I’m building—applying design thinking, ruthless prioritization, and tight feedback loops to deliver results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-[var(--macos-text-primary)] mb-4">Core Expertise</h3>
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
              <h3 className="text-xl font-semibold text-[var(--macos-text-primary)] mb-4">Current Focus</h3>
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
            <h3 className="text-xl font-semibold text-[var(--macos-text-primary)] mb-4">Selected Wins</h3>
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
            <h3 className="text-xl font-semibold text-[var(--macos-text-primary)] mb-4">Advisory & Community</h3>
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
              >
                View Portfolio
              </motion.button>
              <motion.button
                className="px-6 py-3 border border-[var(--macos-border)] text-[var(--macos-text-primary)] rounded-lg font-medium hover:bg-[var(--macos-surface)] transition-colors duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
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

function BlogWindow({ selectedId, onSelectedIdChange, scrollTop, onScrollTopChange }: { selectedId: string | null; onSelectedIdChange: (id: string) => void; scrollTop: number; onScrollTopChange: (t: number) => void; }) {
  const selected = blogPosts.find((p) => p.id === selectedId) ?? null;
  const mainRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = scrollTop || 0;
    }
    // run only on mount to restore position
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
              onClick={() => onSelectedIdChange(post.id)}
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
      <main ref={mainRef} className="flex-1 p-6 overflow-auto" onScroll={(e) => onScrollTopChange((e.target as HTMLDivElement).scrollTop)}>
        {!selected ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-[var(--macos-text-secondary)]">
              <div className="text-xl mb-2">Select a post to read</div>
              <div className="text-sm">Choose from the list on the left.</div>
            </div>
          </div>
        ) : (
          <BlogTemplate post={selected} />
        )}
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

