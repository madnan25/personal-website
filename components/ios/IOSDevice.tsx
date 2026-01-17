"use client";

import { useEffect, useState, useRef } from "react";
import { motion, PanInfo } from "framer-motion";
import StatusBar from "./StatusBar";
import HomeScreen from "./HomeScreen";
import AppWindow from "./AppWindow";
import ControlCenter from "./ControlCenter";
import { blogPosts } from "@/lib/blog";
import BlogTemplate from "@/components/blog/BlogTemplate";
import { Calendar, Linkedin } from "lucide-react";
import MusicPlayer from "@/components/media/MusicPlayer";

// Declare Cloudflare Turnstile on the window to satisfy TypeScript during build
declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

interface AppState {
  id: string;
  title: string;
  isOpen: boolean;
  component: React.ReactNode;
}

type WallpaperOption = 'video' | 'mobile1' | 'inouske' | 'luffyPhone' | 'luffyKaido';

export default function IOSDevice() {
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [wallpaper, setWallpaper] = useState<WallpaperOption>('luffyPhone');

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
    contact: {
      id: 'contact',
      title: 'Contact',
      isOpen: false,
      component: <ContactApp />
    },
    gallery: {
      id: 'gallery',
      title: 'Photos',
      isOpen: false,
      component: <GalleryApp />
    },
    settings: {
      id: 'settings',
      title: 'Settings',
      isOpen: false,
      component: <SettingsApp wallpaper={wallpaper} onChange={setWallpaper} />
    },
    music: {
      id: 'music',
      title: 'Music',
      isOpen: false,
      component: <MusicApp />
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
                  return '/luffy-phone.jpg';
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
      <div className={Object.values(apps).some(app => app.isOpen) ? 'pointer-events-none' : ''}>
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
  const [form, setForm] = useState<{ name: string; email: string; phone: string; subject: 'speaking' | 'work' | 'other'; message: string }>({ name: '', email: '', phone: '', subject: 'speaking', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);

  // Load and render Cloudflare Turnstile widget
  useEffect(() => {
    if (typeof window === 'undefined' || widgetIdRef.current) return;
    const container = widgetContainerRef.current;
    if (!container) return;
    // Script is loaded globally in app/layout.tsx to avoid duplicate loads
    const onReady = () => {
      // Defer render until after animations/layout settle to avoid "Node cannot be found" from iframe
      window.requestAnimationFrame(() => {
        setTimeout(() => {
          if (!container || widgetIdRef.current || !window.turnstile) return;
          try {
            widgetIdRef.current = window.turnstile.render(container, {
              sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '0x4AAAAAAABkMYinukE8nz0Y',
              theme: 'auto',
              size: 'flexible',
              callback: (token: string) => { setTurnstileToken(token); setVerificationMessage(null); },
              'expired-callback': () => { setTurnstileToken(''); setVerificationMessage('Verification expired. Please try again.'); },
              'error-callback': () => { setTurnstileToken(''); setVerificationMessage('Verification failed to load. Please retry.'); },
            });
          } catch {
            setVerificationMessage('Verification failed to initialize. Please close and reopen Contact.');
          }
        }, 300);
      });
    };
    if (window.turnstile) onReady();
    else if (typeof window !== 'undefined') window.addEventListener('load', onReady, { once: true });
    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = undefined;
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        body: JSON.stringify({ ...form, turnstileToken }),
      });
      const data = await res.json();
      setResult({ ok: res.ok, message: data.message || (res.ok ? 'Message sent!' : 'Failed to send message.') });
      if (res.ok) {
        setForm({ name: '', email: '', phone: '', subject: 'speaking', message: '' });
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
        setTurnstileToken('');
      }
    } catch {
      setResult({ ok: false, message: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4" style={{ position: 'relative', zIndex: 1, isolation: 'isolate' }}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="text-xl font-semibold text-[var(--macos-text-primary)] mb-1">Get in touch</div>
          <div className="text-sm text-[var(--macos-text-secondary)]">I usually reply within a day.</div>
        </div>

        {result && (
          <div className={`mb-6 text-sm rounded-xl border px-4 py-3 ${result.ok ? 'border-teal-500/40 text-teal-600 bg-teal-500/5' : 'border-red-500/40 text-red-600 bg-red-500/5'}`}>{result.message}</div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="contact-name" className="text-sm font-medium text-[var(--macos-text-primary)]">Name<span className="text-red-500 ml-1">*</span></label>
              <input 
                id="contact-name" 
                name="name" 
                required 
                placeholder="Your name" 
                value={form.name} 
                onChange={(e) => setForm(s => ({ ...s, name: e.target.value }))} 
                disabled={isSubmitting} 
                className="px-4 py-3 rounded-xl border border-[var(--macos-border)] bg-[var(--macos-surface)] text-[var(--macos-text-primary)] placeholder:text-[var(--macos-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--macos-accent)] focus:border-transparent disabled:opacity-50 text-base" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="contact-email" className="text-sm font-medium text-[var(--macos-text-primary)]">Email<span className="text-red-500 ml-1">*</span></label>
              <input 
                id="contact-email" 
                name="email" 
                type="email" 
                required 
                placeholder="your@email.com" 
                value={form.email} 
                onChange={(e) => setForm(s => ({ ...s, email: e.target.value }))} 
                disabled={isSubmitting} 
                className="px-4 py-3 rounded-xl border border-[var(--macos-border)] bg-[var(--macos-surface)] text-[var(--macos-text-primary)] placeholder:text-[var(--macos-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--macos-accent)] focus:border-transparent disabled:opacity-50 text-base" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="contact-phone" className="text-sm font-medium text-[var(--macos-text-primary)]">Phone</label>
              <input 
                id="contact-phone" 
                name="phone" 
                type="tel" 
                placeholder="+1 (555) 123-4567" 
                value={form.phone} 
                onChange={(e) => setForm(s => ({ ...s, phone: e.target.value }))} 
                disabled={isSubmitting} 
                className="px-4 py-3 rounded-xl border border-[var(--macos-border)] bg-[var(--macos-surface)] text-[var(--macos-text-primary)] placeholder:text-[var(--macos-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--macos-accent)] focus:border-transparent disabled:opacity-50 text-base" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="contact-subject" className="text-sm font-medium text-[var(--macos-text-primary)]">Subject<span className="text-red-500 ml-1">*</span></label>
              <select 
                id="contact-subject" 
                name="subject" 
                required 
                value={form.subject} 
                onChange={(e) => setForm(s => ({ ...s, subject: e.target.value as 'speaking' | 'work' | 'other' }))} 
                disabled={isSubmitting} 
                className="px-4 py-3 rounded-xl border border-[var(--macos-border)] bg-[var(--macos-surface)] text-[var(--macos-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--macos-accent)] focus:border-transparent disabled:opacity-50 text-base"
              >
                <option value="speaking">Speaking</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="contact-message" className="text-sm font-medium text-[var(--macos-text-primary)]">Message<span className="text-red-500 ml-1">*</span></label>
              <textarea 
                id="contact-message" 
                name="message" 
                required 
                placeholder="Tell me about your project..." 
                rows={5} 
                value={form.message} 
                onChange={(e) => setForm(s => ({ ...s, message: e.target.value }))} 
                disabled={isSubmitting} 
                className="px-4 py-3 rounded-xl border border-[var(--macos-border)] bg-[var(--macos-surface)] text-[var(--macos-text-primary)] placeholder:text-[var(--macos-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--macos-accent)] focus:border-transparent disabled:opacity-50 resize-none text-base" 
              />
            </div>
          </div>

          <div className="space-y-4">
            <div ref={widgetContainerRef} className="flex justify-center items-center min-h-[70px]" />
            {!turnstileToken && (
              <div className="text-xs text-[var(--macos-text-secondary)] px-3 py-2 rounded-md bg-[var(--macos-surface)] border border-[var(--macos-border)]">
                {verificationMessage || 'Complete the verification above to enable Send.'}
              </div>
            )}
            <button 
              type="submit" 
              disabled={isSubmitting || !turnstileToken} 
              className="w-full px-6 py-4 bg-[var(--macos-accent)] text-white rounded-xl font-semibold text-base hover:bg-[var(--macos-accent-hover)] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {isSubmitting ? 'Sending…' : 'Send Message'}
            </button>
          </div>

          <div className="my-6 border-t border-[var(--macos-separator)]" />

          <div className="space-y-3">
            <div className="text-sm font-medium text-[var(--macos-text-secondary)]">Other ways to reach me</div>
            <div className="flex flex-col gap-3">
              <a 
                href="https://cal.com/madnan" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Book a meeting on Cal.com" 
                className="flex items-center gap-3 p-4 rounded-xl border border-[var(--macos-border)] bg-[var(--macos-surface)] hover:bg-[var(--macos-surface)]/80 active:scale-95 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-[var(--macos-accent)] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-medium text-[var(--macos-text-primary)]">Book A Meeting</div>
                  <div className="text-sm text-[var(--macos-text-secondary)]">Schedule a call with me</div>
        </div>
              </a>
              <a 
                href="https://www.linkedin.com/in/mdayemadnan/" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="LinkedIn profile" 
                className="flex items-center gap-3 p-4 rounded-xl border border-[var(--macos-border)] bg-[var(--macos-surface)] hover:bg-[var(--macos-surface)]/80 active:scale-95 transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <Linkedin className="w-5 h-5 text-white" />
          </div>
          <div>
                  <div className="font-medium text-[var(--macos-text-primary)]">LinkedIn</div>
                  <div className="text-sm text-[var(--macos-text-secondary)]">Connect with me professionally</div>
                </div>
              </a>
            </div>
          </div>
        </form>
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

function GalleryApp() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  const videos = [
    {
      id: 'naughty',
      title: 'naughty video',
      duration: '3:33',
      thumbnail: '/naughty-blur.jpg', // Provided blurred thumbnail
      videoId: 'dQw4w9WgXcQ'
    }
  ];

  if (selectedVideo) {
    const video = videos.find(v => v.id === selectedVideo);
    return (
      <div className="p-4">
        <div className="mb-4">
          <button 
            onClick={() => setSelectedVideo(null)}
            className="flex items-center gap-2 text-[var(--macos-accent)] hover:text-[var(--macos-accent-hover)] transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to Photos
          </button>
        </div>
        <div className="aspect-video bg-black rounded-xl overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${video?.videoId}?autoplay=1&rel=0`}
            title={video?.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <div className="mt-4">
          <h3 className="text-lg font-semibold text-[var(--macos-text-primary)]">{video?.title}</h3>
          <p className="text-sm text-[var(--macos-text-secondary)]">Duration: {video?.duration}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <p className="text-sm text-[var(--macos-text-secondary)]">Your photo and video library</p>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {videos.map((video) => (
          <div key={video.id} className="space-y-1 select-none">
            <motion.button
              onClick={() => setSelectedVideo(video.id)}
              className="relative aspect-square bg-[var(--macos-surface)] rounded-lg overflow-hidden w-full block"
              whileTap={{ scale: 0.95 }}
            >
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${video.thumbnail})` }}
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M8 5V19L19 12L8 5Z" fill="white"/>
                  </svg>
                </div>
              </div>
              <div className="absolute top-1 right-1">
                <div className="px-1.5 py-0.5 bg-red-500/90 rounded-full">
                  <span className="text-white text-xs font-medium">18+</span>
                </div>
              </div>
            </motion.button>
            <div className="px-0.5">
              <div className="text-[13px] leading-tight text-[var(--macos-text-primary)] truncate">{video.title}</div>
              <div className="text-[11px] text-[var(--macos-text-secondary)]">{video.duration}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MusicApp() {
  return <MusicPlayer variant="ios" />;
}

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
