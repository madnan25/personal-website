"use client";

import { useEffect, useRef, useState } from "react";
import DesktopWallpaper, { GradientBackground } from "./DesktopWallpaper";
import MenuBar from "./MenuBar";
import Dock from "./Dock";
import Window from "./Window";
import { motion } from "framer-motion";
import BlogTemplate from "@/components/blog/BlogTemplate";
import { blogPosts } from "@/lib/blog";
import { DockProvider, useDockContext } from "./DockContext";
// import { cn } from "@/lib/utils";

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
      component: <BlogWindow />
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
  ]);

  const handleDockItemClick = (itemId: string) => {
    setWindows(prev => prev.map(w => ({
      ...w,
      isOpen: w.id === itemId ? true : w.isOpen,
      isMinimized: w.id === itemId ? false : w.isMinimized,
    })));
  };

  const { getEl, setMinimized } = useDockContext();

  const handleWindowClose = (windowId: string) => {
    setWindows(prev => 
      prev.map(window => 
        window.id === windowId 
          ? { ...window, isOpen: false }
          : window
      )
    );
    // Restore global UI when closing a full-screen window
    setIsAnyMaximized(false);
    setIsTopHover(false);
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
        <MenuBar hidden={isAnyMaximized && !isTopHover} onMouseLeave={hideBarsWithDelay} />
      </div>
      
      {/* Windows */}
      {windows.map(window => 
        window.isOpen && !window.isMinimized && getEl(window.id) && (
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
            minimizeTargetEl={getEl(window.id)}
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
          >
            {window.component}
          </Window>
        )
      )}
      
      {/* Dock */}
      <Dock 
        onItemClick={handleDockItemClick}
        minimizedIds={windows.filter(w => w.isMinimized).map(w => w.id)}
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
function AboutWindow() {
  return (
    <div className="p-8 h-full overflow-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl"
      >
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 mb-6 flex items-center justify-center text-3xl"
          >
            👨‍💻
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl font-light text-[var(--macos-text-primary)] mb-3"
          >
            Mohammad Dayem Adnan
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-xl text-[var(--macos-text-secondary)] mb-4"
          >
            I build teams, products, and repeatable wins.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-wrap gap-2 mb-8"
          >
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
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="space-y-8"
        >
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

function SettingsWindow({ onSetWallpaper }: { onSetWallpaper: (src: string) => void }) {
  const wallpapers = [
    { src: "/luffy-neon.jpg", label: "Neon Luffy" },
    { src: "/eagle-forest.jpg", label: "Eagle Forest" },
    { src: "gradient:big-sur", label: "Gradient – Big Sur" },
    { src: "gradient:monterey", label: "Gradient – Monterey" },
    { src: "gradient:sonoma", label: "Gradient – Sonoma" },
  ];
  return (
    <div className="p-4 h-full overflow-auto">
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

function PlaceholderWindow({ title }: { title: string }) {
  return (
    <div className="p-6">
      <div className="text-lg font-medium mb-2">{title}</div>
      <div className="text-sm text-[var(--macos-text-secondary)]">Coming soon.</div>
    </div>
  );
}

function BlogWindow() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = blogPosts.find((p) => p.id === selectedId) ?? null;
  return (
    <div className="h-full flex">
      <aside className="w-64 border-r border-[var(--macos-border)] p-4 space-y-3 overflow-auto">
        <div className="text-sm font-medium text-[var(--macos-text-secondary)] mb-1">Posts</div>
        {blogPosts.map((post) => {
          const isActive = post.id === selectedId;
          return (
            <button
              key={post.id}
              onClick={() => setSelectedId(post.id)}
              className={`w-full text-left rounded-md p-3 transition-colors ${
                isActive
                  ? 'bg-[var(--macos-accent)]/10 border border-[var(--macos-accent)]/30'
                  : 'hover:bg-[var(--macos-surface)] border border-transparent'
              }`}
            >
              <div className="text-sm font-medium text-[var(--macos-text-primary)]">{post.title}</div>
              <div className="text-xs text-[var(--macos-text-secondary)] truncate">{post.description}</div>
            </button>
          );
        })}
      </aside>
      <main className="flex-1 p-6 overflow-auto">
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

