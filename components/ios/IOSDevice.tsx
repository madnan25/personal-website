"use client";

import { useEffect, useState } from "react";
import { motion, PanInfo } from "framer-motion";
import StatusBar from "./StatusBar";
import HomeScreen from "./HomeScreen";
import AppWindow from "./AppWindow";
import ControlCenter from "./ControlCenter";
import { blogPosts } from "@/lib/blog";
import BlogTemplate from "@/components/blog/BlogTemplate";

interface AppState {
  id: string;
  title: string;
  isOpen: boolean;
  component: React.ReactNode;
}

type WallpaperOption = 'video' | 'mobile1' | 'inouske' | 'luffyPhone' | 'luffyKaido';

export default function IOSDevice() {
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [wallpaper, setWallpaper] = useState<WallpaperOption>('video');

  // Load/persist wallpaper preference
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('ios_wallpaper') as WallpaperOption | null;
      if (saved === 'video' || saved === 'mobile1' || saved === 'inouske' || saved === 'luffyPhone' || saved === 'luffyKaido') {
        setWallpaper(saved);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      window.localStorage.setItem('ios_wallpaper', wallpaper);
    } catch {}
  }, [wallpaper]);
  const [apps, setApps] = useState<Record<string, AppState>>({
    about: {
      id: 'about',
      title: 'About',
      isOpen: false,
      component: <AboutApp />
    },
    blog: {
      id: 'blog',
      title: 'Blog',
      isOpen: false,
      component: <BlogApp />
    },
    projects: {
      id: 'projects',
      title: 'Projects',
      isOpen: false,
      component: <ProjectsApp />
    },
    settings: {
      id: 'settings',
      title: 'Settings',
      isOpen: false,
      component: <SettingsApp wallpaper={wallpaper} onChange={setWallpaper} />
    },
  });

  const handleControlCenterDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const startX = (event as MouseEvent).clientX || 
                  ((event as TouchEvent).touches && (event as TouchEvent).touches[0]?.clientX) || 0;
    const windowWidth = window.innerWidth;
    
    if (startX > windowWidth * 0.7 && info.offset.y > 50) {
      setControlCenterOpen(true);
    }
  };

  const handleAppOpen = (appId: string) => {
    setApps(prev => ({
      ...prev,
      [appId]: { ...prev[appId], isOpen: true }
    }));
  };

  const handleAppClose = (appId: string) => {
    setApps(prev => ({
      ...prev,
      [appId]: { ...prev[appId], isOpen: false }
    }));
  };

  return (
    <div
      className="relative overflow-hidden bg-black text-[var(--macos-text-primary)]"
      style={{
        width: '100svw',
        height: '100svh',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}
    >
      <div className="absolute inset-0 z-0 overflow-hidden">
        {wallpaper === 'video' ? (
          <motion.video
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            src="/inouske-video.mp4"
            autoPlay
            muted
            playsInline
            loop
          />
        ) : (
          <motion.div
            className="absolute inset-0 bg-center bg-cover"
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ backgroundImage: `url(${(() => {
              switch (wallpaper) {
                case 'mobile1':
                  return '/mobile-wallpaper1.jpeg';
                case 'inouske':
                  return '/inouske.jpeg';
                case 'luffyPhone':
                  return '/luffy-phone.jpg';
                case 'luffyKaido':
                  return '/luffy-kaido.jpeg';
                default:
                  return '/mobile-wallpaper1.jpeg';
              }
            })()})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
      </div>
      
      <motion.div
        className="absolute top-0 right-0 w-20 h-20 z-10 pointer-events-auto"
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDrag={handleControlCenterDrag}
      />

      <StatusBar />
      {/* Prevent background scroll when any window is open by toggling pointer events */}
      <div className={apps.about.isOpen || apps.blog.isOpen || apps.projects.isOpen || apps.settings.isOpen ? 'pointer-events-none' : ''}>
        <HomeScreen onAppOpen={handleAppOpen} />
      </div>
      
      {Object.entries(apps).map(([id, app]) => (
        <AppWindow
          key={id}
          title={app.title}
          isOpen={app.isOpen}
          onClose={() => handleAppClose(id)}
        >
          {id === 'settings' ? (
            <SettingsApp wallpaper={wallpaper} onChange={setWallpaper} />
          ) : (
            app.component
          )}
        </AppWindow>
      ))}
      
      <ControlCenter 
        isOpen={controlCenterOpen} 
        onClose={() => setControlCenterOpen(false)} 
      />
    </div>
  );
}

function AboutApp() {
  return (
    <div className="p-0">
      {/* Embed the shared AboutContent for consistent copy/design */}
      <div className="px-4 py-4">
        {/* eslint-disable-next-line @typescript-eslint/no-require-imports */}
        {require('@/components/hero/AboutContent').default()}
      </div>
    </div>
  );
}

function ProjectsApp() {
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 gap-4">
        {[
          {
            title: 'CareHub',
            desc: 'Tenant management without chaos.',
            emoji: '🏢',
            color: 'from-purple-500 to-purple-700'
          },
          {
            title: 'Awards Voting',
            desc: 'Trusted, auditable tallies.',
            emoji: '🏆',
            color: 'from-indigo-500 to-indigo-700'
          },
          {
            title: 'Marketing Portal',
            desc: 'Alignment that pays for itself.',
            emoji: '📈',
            color: 'from-fuchsia-500 to-fuchsia-700'
          },
        ].map((p) => (
          <div key={p.title} className="rounded-2xl p-1 bg-gradient-to-br shadow-lg"
            style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` }}
          >
            <div className={`rounded-2xl p-4 bg-[var(--macos-surface)]/90 backdrop-blur border border-[var(--macos-border)]`}
              style={{
                // Tailwind dynamic gradient via className on outer not reliable inline; keep inner neutral
              }}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-gradient-to-br ${p.color} text-white`}>{p.emoji}</div>
                <div>
                  <div className="font-semibold text-[var(--macos-text-primary)]">{p.title}</div>
                  <div className="text-sm text-[var(--macos-text-secondary)]">{p.desc}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactApp() {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-[var(--macos-text-primary)] mb-4">Get in Touch</h2>
      <div className="space-y-4">
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 bg-[var(--macos-accent)] rounded-full flex items-center justify-center">
            <span className="text-white">📧</span>
          </div>
          <div>
            <div className="font-medium text-[var(--macos-text-primary)]">Email</div>
            <div className="text-sm text-[var(--macos-text-secondary)]">hello@mdadnan.com</div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white">💼</span>
          </div>
          <div>
            <div className="font-medium text-[var(--macos-text-primary)]">LinkedIn</div>
            <div className="text-sm text-[var(--macos-text-secondary)]">@mdadnan</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BlogApp() {
  const [selected, setSelected] = useState<string | null>(null);
  const post = blogPosts.find((p) => p.id === selected) || null;
  const [dynamicPost, setDynamicPost] = useState<typeof post | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load file-backed content for selected post
  useEffect(() => {
    setDynamicPost(null);
    setError(null);
    if (!post) return;
    if (post.content && post.content.length > 0) return;
    setIsLoading(true);
    (async () => {
      try {
        if (post.id === 'in-defense-of-bubbles') {
          const mod = await import('@/lib/posts/in-defense-of-bubbles');
          setDynamicPost({ ...post, content: mod.content });
        } else if (post.id === 'build-things-that-matter') {
          const mod = await import('@/lib/posts/build-things-that-matter');
          setDynamicPost({ ...post, content: mod.content });
        }
      } catch {
        setError('Failed to load article');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [post]);

  return (
    <div className="p-6">
      {!post ? (
        <div className="space-y-3">
          {blogPosts.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className="w-full text-left rounded-xl p-4 border border-[var(--macos-border)] bg-[var(--macos-surface)]/80 hover:bg-[var(--macos-surface)]"
            >
              <div className="text-[var(--macos-text-primary)] font-medium">{p.title}</div>
              <div className="text-[var(--macos-text-secondary)] text-sm truncate">{p.description}</div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <button onClick={() => setSelected(null)} className="text-sm text-[var(--macos-accent)]">← Back</button>
          {isLoading ? (
            <div className="text-[var(--macos-text-secondary)]">Loading…</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : (
            <BlogTemplate post={dynamicPost ?? post} />
          )}
        </div>
      )}
    </div>
  );
}

// GalleryApp removed for streamlined mobile home screen

function SettingsApp({ wallpaper, onChange }: { wallpaper: WallpaperOption; onChange: (w: WallpaperOption) => void; }) {
  const liveOptions: Array<{ id: WallpaperOption; label: string; desc: string; preview: React.ReactNode }> = [
    {
      id: 'video',
      label: 'Live Wallpaper',
      desc: 'Looping background animation',
      preview: (
        <div className="relative w-full h-24 rounded-lg overflow-hidden">
          <video className="absolute inset-0 w-full h-full object-cover" src="/inouske-video.mp4" autoPlay muted playsInline loop />
          <div className="absolute inset-0 bg-black/20" />
        </div>
      )
    }
  ];
  const staticOptions: Array<{ id: WallpaperOption; label: string; desc: string; preview: React.ReactNode }> = [
    {
      id: 'mobile1',
      label: 'Neon Skyline',
      desc: 'Static image',
      preview: (
        <div className="w-full h-24 rounded-lg overflow-hidden bg-center bg-cover" style={{ backgroundImage: 'url(/mobile-wallpaper1.jpeg)' }} />
      )
    },
    {
      id: 'inouske',
      label: 'Inouske',
      desc: 'Static image',
      preview: (
        <div
          className="w-full h-24 rounded-lg overflow-hidden bg-cover"
          style={{ backgroundImage: 'url(/inouske.jpeg)', backgroundPosition: 'center 75%' }}
        />
      )
    },
    {
      id: 'luffyPhone',
      label: 'Luffy (Phone)',
      desc: 'Static image',
      preview: (
        <div className="w-full h-24 rounded-lg overflow-hidden bg-center bg-cover" style={{ backgroundImage: 'url(/luffy-phone.jpg)' }} />
      )
    },
    {
      id: 'luffyKaido',
      label: 'Luffy vs Kaido',
      desc: 'Static image',
      preview: (
        <div className="w-full h-24 rounded-lg overflow-hidden bg-center bg-cover" style={{ backgroundImage: 'url(/luffy-kaido.jpeg)' }} />
      )
    }
  ];
  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--macos-text-secondary)] mb-2">Live Wallpapers</div>
          <div className="grid grid-cols-1 gap-3">
            {liveOptions.map(opt => {
              const active = wallpaper === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onChange(opt.id)}
                  className={`w-full text-left rounded-xl border transition-colors ${active ? 'border-[var(--macos-accent)] ring-2 ring-[var(--macos-accent)]/30' : 'border-[var(--macos-border)] hover:bg-[var(--macos-surface)]/60'}`}
                >
                  <div className="p-3 flex items-center gap-3">
                    <div className="w-36 flex-shrink-0">{opt.preview}</div>
                    <div>
                      <div className="font-medium text-[var(--macos-text-primary)] flex items-center gap-2">
                        {opt.label}
                        {active && <span className="inline-block w-2 h-2 rounded-full bg-[var(--macos-accent)]" />}
                      </div>
                      <div className="text-xs text-[var(--macos-text-secondary)]">{opt.desc}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-[var(--macos-text-secondary)] mb-2">Static Wallpapers</div>
          <div className="grid grid-cols-1 gap-3">
            {staticOptions.map(opt => {
              const active = wallpaper === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => onChange(opt.id)}
                  className={`w-full text-left rounded-xl border transition-colors ${active ? 'border-[var(--macos-accent)] ring-2 ring-[var(--macos-accent)]/30' : 'border-[var(--macos-border)] hover:bg-[var(--macos-surface)]/60'}`}
                >
                  <div className="p-3 flex items-center gap-3">
                    <div className="w-36 flex-shrink-0">{opt.preview}</div>
                    <div>
                      <div className="font-medium text-[var(--macos-text-primary)] flex items-center gap-2">
                        {opt.label}
                        {active && <span className="inline-block w-2 h-2 rounded-full bg-[var(--macos-accent)]" />}
                      </div>
                      <div className="text-xs text-[var(--macos-text-secondary)]">{opt.desc}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
