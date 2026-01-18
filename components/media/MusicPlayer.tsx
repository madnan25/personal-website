"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Music2, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

type MusicPlayerVariant = "macos" | "ios";

type Song = {
  name: string;
  url: string;
  description?: string | null;
};

interface MusicPlayerProps {
  variant?: MusicPlayerVariant;
  className?: string;
}

const formatTime = (value: number) => {
  const total = Math.max(0, Math.floor(value));
  const minutes = Math.floor(total / 60).toString();
  const seconds = (total % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const prettifyName = (name: string) => {
  const base = name.replace(/\.[^/.]+$/, "");
  return base.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
};

const readSynchsafeInt = (b0: number, b1: number, b2: number, b3: number) => {
  return ((b0 & 0x7f) << 21) | ((b1 & 0x7f) << 14) | ((b2 & 0x7f) << 7) | (b3 & 0x7f);
};

const readUint32BE = (view: DataView, offset: number) => {
  return (
    (view.getUint8(offset) << 24) |
    (view.getUint8(offset + 1) << 16) |
    (view.getUint8(offset + 2) << 8) |
    view.getUint8(offset + 3)
  ) >>> 0;
};

const findZero = (bytes: Uint8Array, start: number) => {
  for (let i = start; i < bytes.length; i++) if (bytes[i] === 0) return i;
  return -1;
};

const findZeroUTF16 = (bytes: Uint8Array, start: number) => {
  for (let i = start; i + 1 < bytes.length; i += 2) {
    if (bytes[i] === 0 && bytes[i + 1] === 0) return i;
  }
  return -1;
};

const extractEmbeddedCoverFromID3 = async (url: string) => {
  const INITIAL_BYTES = 96_000; // fast initial probe (~96KB)
  const MAX_BYTES = 1_200_000; // cap expanded fetch to keep things snappy

  const fetchRange = async (endExclusive: number) => {
    const end = Math.max(0, endExclusive - 1);
    let res: Response | null = null;
    try {
      res = await fetch(url, { headers: { Range: `bytes=0-${end}` } });
    } catch {
      return null;
    }
    if (!res || !(res.ok || res.status === 206)) return null;
    const buf = await res.arrayBuffer();
    const bytes = new Uint8Array(buf);
    // If server ignored Range and returned more, slice down to requested size.
    return bytes.length > endExclusive ? bytes.subarray(0, endExclusive) : bytes;
  };

  // 1) Small probe to read ID3 header + tag size
  let bytes = await fetchRange(INITIAL_BYTES);
  if (!bytes || bytes.length < 10) return null;
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return null; // "ID3"

  const versionMajor = bytes[3]; // 3 or 4 are common
  const flags = bytes[5];
  const tagSize = readSynchsafeInt(bytes[6], bytes[7], bytes[8], bytes[9]); // excludes header/footer
  const needBytes = Math.min(10 + tagSize + (flags & 0x10 ? 10 : 0), MAX_BYTES);

  // 2) If the full tag doesn't fit in the probe, re-fetch just enough to parse frames quickly
  if (needBytes > bytes.length) {
    const expanded = await fetchRange(needBytes);
    if (!expanded || expanded.length < 10) return null;
    bytes = expanded;
  }

  const tagEnd = Math.min(10 + tagSize, bytes.length);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  let offset = 10;
  // Skip extended header if present (common in some encoders)
  if (flags & 0x40) {
    if (versionMajor === 3) {
      if (offset + 4 <= tagEnd) {
        const extSize = readUint32BE(view, offset);
        // extSize usually includes the 4 bytes; clamp defensively
        offset = Math.min(tagEnd, offset + Math.max(4, extSize));
      }
    } else if (versionMajor === 4) {
      if (offset + 4 <= tagEnd) {
        const extSize = readSynchsafeInt(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
        offset = Math.min(tagEnd, offset + Math.max(4, extSize));
      }
    }
  }

  while (offset + 10 <= tagEnd) {
    const id = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2], bytes[offset + 3]);
    // Padding reached
    if (id === "\u0000\u0000\u0000\u0000") break;

    const size =
      versionMajor === 4
        ? readSynchsafeInt(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7])
        : readUint32BE(view, offset + 4);
    const frameStart = offset + 10;
    const frameEnd = Math.min(frameStart + size, tagEnd);
    if (size <= 0 || frameStart >= tagEnd) break;

    if (id === "APIC" && frameEnd > frameStart + 10) {
      const frame = bytes.subarray(frameStart, frameEnd);
      const encoding = frame[0]; // 0=latin1, 1=utf16, 2=utf16be, 3=utf8
      let cursor = 1;

      const mimeEnd = findZero(frame, cursor);
      if (mimeEnd === -1) return null;
      const mime = new TextDecoder("latin1").decode(frame.subarray(cursor, mimeEnd)).trim();
      cursor = mimeEnd + 1;
      if (cursor >= frame.length) return null;

      // pictureType
      cursor += 1;
      if (cursor >= frame.length) return null;

      // description (encoding-dependent)
      if (encoding === 1 || encoding === 2) {
        const descEnd = findZeroUTF16(frame, cursor);
        if (descEnd === -1) return null;
        cursor = descEnd + 2;
      } else {
        const descEnd = findZero(frame, cursor);
        if (descEnd === -1) return null;
        cursor = descEnd + 1;
      }
      if (cursor >= frame.length) return null;

      const imageData = frame.subarray(cursor);
      if (!imageData.length) return null;
      const blob = new Blob([imageData], { type: mime || "image/jpeg" });
      return URL.createObjectURL(blob);
    }

    offset = frameEnd;
  }

  return null;
};

export default function MusicPlayer({ variant = "macos", className }: MusicPlayerProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(75);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [durationsByUrl, setDurationsByUrl] = useState<Record<string, number>>({});
  const [coverByUrl, setCoverByUrl] = useState<Record<string, string>>({});
  const [playError, setPlayError] = useState<string | null>(null);
  const coverByUrlRef = useRef<Record<string, string>>({});
  const coverObjectUrlsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const shouldAutoAdvanceRef = useRef<boolean>(false);

  const waitForCanPlay = (audio: HTMLAudioElement, timeoutMs = 2500) => {
    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) return Promise.resolve();
    return new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        audio.removeEventListener("canplay", finish);
        audio.removeEventListener("canplaythrough", finish);
        audio.removeEventListener("loadeddata", finish);
        resolve();
      };
      audio.addEventListener("canplay", finish, { once: true });
      audio.addEventListener("canplaythrough", finish, { once: true });
      audio.addEventListener("loadeddata", finish, { once: true });
      window.setTimeout(finish, timeoutMs);
    });
  };

  const fetchSongs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/songs", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load songs");
      const data = (await res.json()) as { songs?: Song[] };
      setSongs(Array.isArray(data.songs) ? data.songs : []);
    } catch {
      setError("Could not load songs.");
      setSongs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  useEffect(() => {
    if (!songs.length) {
      audioRef.current?.pause();
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setCurrentIndex(0);
      return;
    }
    if (currentIndex >= songs.length) {
      setCurrentIndex(0);
    }
  }, [songs, currentIndex]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = isMuted;
  }, [isMuted]);

  const tracks = useMemo(
    () => songs.map((song) => ({ ...song, title: prettifyName(song.name) })),
    [songs]
  );

  const currentTrack = tracks[currentIndex];

  const effectiveDuration =
    currentTrack?.url ? duration || durationsByUrl[currentTrack.url] || 0 : duration;

  // Keep the audio element in sync with the selected track (helps iOS where metadata often stays 0 until load/play).
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const url = currentTrack?.url;
    if (!url) {
      try {
        audio.removeAttribute("src");
        audio.load();
      } catch {}
      setCurrentTime(0);
      setDuration(0);
      setIsPlaying(false);
      return;
    }

    // If React hasn't updated the element yet or we imperatively changed src, ensure it matches.
    const currentSrcAttr = audio.getAttribute("src") || "";
    if (currentSrcAttr !== url) {
      audio.src = url;
      audio.currentTime = 0;
      setCurrentTime(0);
      setDuration(0);
      // Trigger a metadata fetch; iOS often needs an explicit load().
      audio.load();
    }
  }, [currentTrack?.url]);

  // iOS Safari sometimes needs canplaythrough before play() will actually start.
  useEffect(() => {
    if (variant !== "ios") return;
    const audio = audioRef.current;
    if (!audio) return;
    const onCanPlay = () => {
      if (!audio.paused && isPlaying) return;
      // No-op; we use this hook mainly to ensure the event fires and metadata is ready.
    };
    audio.addEventListener("canplaythrough", onCanPlay);
    return () => {
      audio.removeEventListener("canplaythrough", onCanPlay);
    };
  }, [variant, isPlaying]);

  // Background-load durations for playlist items (metadata only)
  useEffect(() => {
    if (!tracks.length) {
      setDurationsByUrl({});
      return;
    }

    let cancelled = false;
    const urls = tracks.map((t) => t.url);
    const pending = urls.filter((u) => durationsByUrl[u] === undefined);
    if (!pending.length) return;

    const concurrency = 2;
    let idx = 0;

    const loadOne = async (url: string) => {
      return await new Promise<number | null>((resolve) => {
        const a = new Audio();
        a.preload = "metadata";
        a.src = url;
        // Some browsers need an explicit load() to kick off metadata fetching.
        try {
          a.load();
        } catch {}

        let timeoutId: number | null = null;
        const done = (value: number | null) => {
          a.removeEventListener("loadedmetadata", onMeta);
          a.removeEventListener("error", onErr);
          if (timeoutId) window.clearTimeout(timeoutId);
          try {
            a.src = "";
          } catch {}
          resolve(value);
        };

        const onMeta = () => {
          const d = Number.isFinite(a.duration) ? a.duration : 0;
          done(d > 0 ? d : 0);
        };
        const onErr = () => done(null);

        a.addEventListener("loadedmetadata", onMeta, { once: true });
        a.addEventListener("error", onErr, { once: true });

        // Prevent hanging forever if metadata never loads (e.g. Safari edge cases).
        timeoutId = window.setTimeout(() => done(null), 5000) as unknown as number;
      });
    };

    const pump = async () => {
      while (!cancelled && idx < pending.length) {
        const url = pending[idx++];
        const d = await loadOne(url);
        if (cancelled) return;
        // Store 0 for failures/timeouts so UI stops waiting.
        setDurationsByUrl((prev) => (prev[url] === undefined ? { ...prev, [url]: typeof d === "number" ? d : 0 } : prev));
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, pending.length) }, () => pump());
    void Promise.all(workers);

    return () => {
      cancelled = true;
    };
    // Intentionally omit durationsByUrl from deps to avoid re-spawning workers on each update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks]);

  const playTrackAtIndex = async (index: number, resetTime = true) => {
    if (!tracks.length) return;
    const safeIndex = ((index % tracks.length) + tracks.length) % tracks.length;
    const track = tracks[safeIndex];
    setCurrentIndex(safeIndex);

    const audio = audioRef.current;
    if (!audio) {
      setIsPlaying(true);
      return;
    }

    try {
      setPlayError(null);
      const absolute = new URL(track.url, window.location.href).toString();
      if (audio.src !== absolute) {
        audio.src = track.url;
        if (resetTime) audio.currentTime = 0;
      }
      // Ensure metadata is refreshed before play on iOS Safari
      audio.load();
      await waitForCanPlay(audio);
      await audio.play();
      setIsPlaying(true);
    } catch (e) {
      setIsPlaying(false);
      const err = e as { name?: string; message?: string };
      setPlayError(err?.name ? `${err.name}${err.message ? `: ${err.message}` : ""}` : "Failed to play audio");
    }
  };

  const selectTrack = (index: number) => {
    void playTrackAtIndex(index, true);
  };

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        setPlayError(null);
        // Always load before play on iOS; it helps avoid 0:00 and NotAllowed edge cases.
        if (currentTrack?.url) {
          const absolute = new URL(currentTrack.url, window.location.href).toString();
          if (audio.src !== absolute) {
            audio.src = currentTrack.url;
            audio.currentTime = 0;
            setCurrentTime(0);
            setDuration(0);
          }
        }
        // If src isn't ready yet (can happen on iOS), set it and load before play.
        if (!audio.getAttribute("src") && currentTrack?.url) {
          audio.src = currentTrack.url;
          audio.currentTime = 0;
        }
        audio.load();
        await waitForCanPlay(audio);
        // Calling play() from a user gesture is critical on iOS Safari.
        await audio.play();
        setIsPlaying(true);
        shouldAutoAdvanceRef.current = true;
      } catch (e) {
        const err = e as { name?: string; message?: string };
        setPlayError(err?.name ? `${err.name}${err.message ? `: ${err.message}` : ""}` : "Failed to play audio");
      }
    } else {
      audio.pause();
      setIsPlaying(false);
      // If the user manually paused, don't autoplay the next track.
      shouldAutoAdvanceRef.current = false;
    }
  };

  const playNext = () => {
    void playTrackAtIndex(currentIndex + 1, true);
  };

  const playPrev = () => {
    void playTrackAtIndex(currentIndex - 1, true);
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value;
    setCurrentTime(value);
  };

  // Prevent window drag on macOS only (capture phase to beat framer-motion drag on Window)
  // IMPORTANT: do NOT stop propagation on iOS — it can break Safari's user-gesture detection for audio.play().
  const preventWindowDragCapture = (e: React.SyntheticEvent) => {
    if (variant === "macos") e.stopPropagation();
  };

  const hasSongs = tracks.length > 0;
  const sliderProgress = effectiveDuration ? (currentTime / effectiveDuration) * 100 : 0;
  const volumeProgress = volume;

  const durationLabelFor = (trackUrl: string) => {
    const d = durationsByUrl[trackUrl];
    if (d === undefined) return "…";
    if (typeof d !== "number" || !Number.isFinite(d) || d <= 0) return "--:--";
    return formatTime(d);
  };

  const durationsPendingCount = useMemo(() => {
    if (!tracks.length) return 0;
    return tracks.reduce((acc, t) => (durationsByUrl[t.url] === undefined ? acc + 1 : acc), 0);
  }, [durationsByUrl, tracks]);

  // Keep a ref for fast "already fetched" checks without re-triggering effects
  useEffect(() => {
    coverByUrlRef.current = coverByUrl;
  }, [coverByUrl]);

  // Fetch embedded cover art for the currently selected track (same-origin /public/songs)
  useEffect(() => {
    const url = currentTrack?.url;
    if (!url) return;
    if (coverByUrlRef.current[url] !== undefined) return;

    let cancelled = false;
    (async () => {
      const cover = await extractEmbeddedCoverFromID3(url);
      if (cancelled) {
        if (cover) URL.revokeObjectURL(cover);
        return;
      }
      if (cover) coverObjectUrlsRef.current.add(cover);
      setCoverByUrl((prev) => ({ ...prev, [url]: cover ?? "" }));
    })();

    return () => {
      cancelled = true;
    };
  }, [variant, currentTrack?.url]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    const urls = coverObjectUrlsRef.current;
    return () => {
      urls.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      });
      urls.clear();
    };
  }, []);

  if (variant === "ios") {
    const coverUrl = currentTrack?.url ? coverByUrl[currentTrack.url] : "";
    return (
      <div
        className={cn(
          "h-full w-full text-[var(--macos-text-primary)]",
          "p-4",
          className
        )}
        onPointerDownCapture={preventWindowDragCapture}
        onMouseDownCapture={preventWindowDragCapture}
        onTouchStartCapture={preventWindowDragCapture}
      >
        <div className="h-full flex flex-col min-h-0">
          {/* Scrollable content */}
          <div className="flex-1 min-h-0 overflow-auto pb-4">
            <div className="mx-auto max-w-md">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-[var(--macos-text-secondary)]">
                  {hasSongs ? `${tracks.length} songs` : "No songs"}
                </div>
                <button
                  onClick={fetchSongs}
                  className="text-xs px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
                >
                  Refresh
                </button>
              </div>

              <div className="rounded-3xl overflow-hidden bg-black/15 border border-white/10 shadow-xl">
                <div className="p-4">
                  <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black/20 relative">
                    {coverUrl ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${coverUrl})` }}
                      />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            "radial-gradient(circle at 30% 30%, rgba(65,234,212,0.55), transparent 45%), radial-gradient(circle at 70% 20%, rgba(56,189,248,0.45), transparent 50%), radial-gradient(circle at 50% 80%, rgba(244,63,94,0.25), transparent 55%), linear-gradient(135deg, rgba(15,23,42,0.85), rgba(30,41,59,0.85))",
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/15" />
                    {!coverUrl && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="h-20 w-20 rounded-3xl bg-white/10 border border-white/15 backdrop-blur flex items-center justify-center shadow-2xl">
                          <Music2 className="w-10 h-10 text-white/90" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="text-2xl font-semibold leading-tight">
                      {currentTrack ? currentTrack.title : "Select a song"}
                    </div>
                    <div className="text-sm text-[var(--macos-text-secondary)] mt-1">
                      {currentTrack?.description ? currentTrack.description : " "}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-xs uppercase tracking-wide text-[var(--macos-text-secondary)] mb-2">
                  Library
                </div>
                <div className="rounded-2xl overflow-hidden bg-black/10 border border-white/10">
                  {isLoading ? (
                    <div className="px-4 py-6 text-sm text-[var(--macos-text-secondary)]">Loading songs…</div>
                  ) : error ? (
                    <div className="px-4 py-6 text-sm text-red-500">{error}</div>
                  ) : !hasSongs ? (
                    <div className="px-4 py-6 text-sm text-[var(--macos-text-secondary)]">
                      Add mp3 files to <span className="font-medium">/public/songs</span>.
                    </div>
                  ) : (
                    tracks.map((track, index) => {
                      const isActive = index === currentIndex;
                      const rightLabel = isActive ? (isPlaying ? "Playing" : "Paused") : "";
                      return (
                        <button
                          key={track.url}
                          onClick={() => selectTrack(index)}
                          className={cn(
                            "w-full text-left px-4 py-4 border-b border-white/10 transition-colors",
                            isActive ? "bg-[var(--macos-accent)]/18" : "hover:bg-white/5"
                          )}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-base font-medium truncate">{track.title || track.name}</div>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              {rightLabel ? (
                                <span className="text-sm text-[var(--macos-accent)]">{rightLabel}</span>
                              ) : null}
                              <span className="text-sm text-[var(--macos-text-secondary)] tabular-nums">
                                {durationLabelFor(track.url)}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Fixed bottom controls */}
          <div className="border-t border-white/10 bg-black/10 backdrop-blur-xl rounded-2xl px-4 py-4">
            {playError && (
              <div className="mb-3 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                Playback error: {playError}. If you’re on iOS, try tapping Play again (Safari requires a direct user gesture).
              </div>
            )}
            <div className="flex items-center justify-center gap-4 mb-4">
              <button
                onClick={playPrev}
                disabled={!hasSongs}
                className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Previous"
              >
                <SkipBack className="w-6 h-6" />
              </button>
              <button
                onClick={togglePlay}
                disabled={!hasSongs}
                className="h-14 w-14 rounded-3xl bg-[var(--macos-accent)] text-white hover:bg-[var(--macos-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
              </button>
              <button
                onClick={playNext}
                disabled={!hasSongs}
                className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                aria-label="Next"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--macos-text-secondary)] w-10 text-right tabular-nums">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                max={Math.max(1, Math.floor(effectiveDuration))}
                  value={Math.floor(currentTime)}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  disabled={!hasSongs}
                  className="flex-1 h-2 rounded-full cursor-pointer disabled:cursor-not-allowed"
                  style={{
                    background: `linear-gradient(to right, var(--macos-accent) 0%, var(--macos-accent) ${sliderProgress}%, var(--macos-separator) ${sliderProgress}%, var(--macos-separator) 100%)`,
                    WebkitAppearance: "none",
                  }}
                />
                <span className="text-xs text-[var(--macos-text-secondary)] w-10 tabular-nums">
                {formatTime(effectiveDuration)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsMuted((prev) => !prev)}
                  className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 flex items-center justify-center"
                  aria-label={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 h-2 rounded-full cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, var(--macos-accent) 0%, var(--macos-accent) ${volumeProgress}%, var(--macos-separator) ${volumeProgress}%, var(--macos-separator) 100%)`,
                    WebkitAppearance: "none",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      <audio
        ref={audioRef}
        className="sr-only"
        src={currentTrack?.url}
        playsInline
        preload="metadata"
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          setCurrentTime(audio.currentTime);
          setDuration(audio.duration || 0);
        }}
        onLoadedMetadata={(e) => {
          const audio = e.currentTarget;
          setDuration(audio.duration || 0);
        }}
        onDurationChange={(e) => {
          const audio = e.currentTarget;
          setDuration(audio.duration || 0);
        }}
        onPlay={() => {
          setIsPlaying(true);
          shouldAutoAdvanceRef.current = true;
        }}
        onPause={(e) => {
          setIsPlaying(false);
          const a = e.currentTarget;
          if (!a.ended) shouldAutoAdvanceRef.current = false;
        }}
        onEnded={() => {
          if (shouldAutoAdvanceRef.current) {
            playNext();
          } else {
            setCurrentIndex((prev) => (tracks.length ? (prev + 1) % tracks.length : prev));
          }
        }}
      />
      </div>
    );
  }

  // macOS layout inspired by provided screenshot
  return (
    <div
      className={cn("h-full w-full text-[var(--macos-text-primary)]", className)}
      onPointerDownCapture={preventWindowDragCapture}
      onMouseDownCapture={preventWindowDragCapture}
      onTouchStartCapture={preventWindowDragCapture}
    >
      <div className="h-full flex flex-col min-h-0">
        {/* Main content */}
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[360px_1fr] overflow-hidden">
            {/* Left: Now Playing (single surface, no extra card) */}
            <div className="p-4 md:p-6 border-b md:border-b-0 md:border-r border-[var(--macos-glass-border)]/70 min-h-0 overflow-auto pr-3">
              <div className="aspect-square relative overflow-hidden rounded-2xl bg-black/10">
                  {currentTrack?.url && coverByUrl[currentTrack.url] ? (
                    <div
                      className="absolute inset-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${coverByUrl[currentTrack.url]})` }}
                    />
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "radial-gradient(circle at 30% 30%, rgba(65,234,212,0.55), transparent 45%), radial-gradient(circle at 70% 20%, rgba(56,189,248,0.45), transparent 50%), radial-gradient(circle at 50% 80%, rgba(244,63,94,0.25), transparent 55%), linear-gradient(135deg, rgba(15,23,42,0.85), rgba(30,41,59,0.85))",
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-black/20" />
                  {!currentTrack?.url || !coverByUrl[currentTrack.url] ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-24 w-24 rounded-3xl bg-white/10 border border-white/15 backdrop-blur flex items-center justify-center shadow-2xl">
                        <Music2 className="w-12 h-12 text-white/90" />
                      </div>
                    </div>
                  ) : null}
              </div>

              <div className="mt-6">
                <div className="text-3xl font-semibold leading-tight">
                  {currentTrack ? currentTrack.title : "No song selected"}
                </div>
                <div className="text-sm text-[var(--macos-text-secondary)] mt-1">
                  {currentTrack ? " " : "Upload mp3 files to /public/songs"}
                </div>
              </div>

              <div className="mt-6">
                <div className="text-sm font-semibold mb-2">About the Song</div>
                <div className="text-sm text-[var(--macos-text-secondary)] leading-relaxed">
                  {currentTrack
                    ? (currentTrack.description ??
                        "A reflective instrumental piece to set the mood while you explore the site.")
                    : "Add some mp3s and hit Refresh to build your library."}
                </div>
              </div>
            </div>

            {/* Right: Playlist */}
            <div className="p-4 md:p-6 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-semibold">Playlist &amp; Library</div>
                  <div className="text-sm text-[var(--macos-text-secondary)]">
                    {hasSongs ? `${tracks.length} tracks` : "No tracks found"}
                    {hasSongs && durationsPendingCount > 0 ? ` · loading ${durationsPendingCount}…` : ""}
                  </div>
                </div>
                <button
                  onClick={fetchSongs}
                  className="text-sm px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 transition-colors"
                >
                  Refresh
                </button>
              </div>

              <div className="mt-4 flex-1 min-h-0 overflow-auto rounded-2xl bg-black/5">
                  {isLoading ? (
                    <div className="px-5 py-6 text-sm text-[var(--macos-text-secondary)]">Loading songs…</div>
                  ) : error ? (
                    <div className="px-5 py-6 text-sm text-red-500">{error}</div>
                  ) : !hasSongs ? (
                    <div className="px-5 py-6 text-sm text-[var(--macos-text-secondary)]">
                      Add mp3 files to <span className="font-medium">/public/songs</span> to see them here.
                    </div>
                  ) : (
                    tracks.map((track, index) => {
                      const isActive = index === currentIndex;
                      const rightLabel = isActive ? (isPlaying ? "Playing" : "Paused") : "";
                      const rightTime = isActive
                        ? formatTime(duration || durationsByUrl[track.url] || 0)
                        : durationLabelFor(track.url);
                      return (
                        <button
                          key={track.url}
                          onClick={() => selectTrack(index)}
                          className={cn(
                            "w-full text-left px-5 py-4 border-b border-white/10 transition-colors",
                            isActive ? "bg-[var(--macos-accent)]/18" : "hover:bg-white/5"
                          )}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <div className="text-base font-medium truncate">{track.title || track.name}</div>
                            </div>
                            <div className="flex items-center gap-4 flex-shrink-0">
                              {rightLabel ? (
                                <div className="text-sm text-[var(--macos-accent)]">{rightLabel}</div>
                              ) : (
                                <div className="text-sm text-[var(--macos-text-secondary)]">&nbsp;</div>
                              )}
                              <div className="text-sm text-[var(--macos-text-secondary)] tabular-nums w-12 text-right">
                                {rightTime}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
              </div>
            </div>
          </div>

          {/* Bottom bar: controls always visible */}
          <div className="px-4 md:px-6 py-4 border-t border-white/10 bg-black/10 backdrop-blur-xl">
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-center">
              {/* Transport */}
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <button
                  onClick={playPrev}
                  disabled={!hasSongs}
                  className="h-11 w-11 rounded-xl bg-[var(--macos-accent)]/20 border border-[var(--macos-accent)]/25 hover:bg-[var(--macos-accent)]/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label="Previous track"
                >
                  <SkipBack className="w-6 h-6" />
                </button>
                <button
                  onClick={togglePlay}
                  disabled={!hasSongs}
                  className="h-12 w-12 rounded-2xl bg-[var(--macos-accent)] text-white hover:bg-[var(--macos-accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shadow-lg"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7" />}
                </button>
                <button
                  onClick={playNext}
                  disabled={!hasSongs}
                  className="h-11 w-11 rounded-xl bg-[var(--macos-accent)]/20 border border-[var(--macos-accent)]/25 hover:bg-[var(--macos-accent)]/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                  aria-label="Next track"
                >
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>

              {/* Seek + Volume */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[var(--macos-text-secondary)] w-12 text-right tabular-nums">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, Math.floor(effectiveDuration))}
                    value={Math.floor(currentTime)}
                    onChange={(e) => handleSeek(Number(e.target.value))}
                    disabled={!hasSongs}
                    className="flex-1 h-2 rounded-full cursor-pointer disabled:cursor-not-allowed"
                    style={{
                      background: `linear-gradient(to right, var(--macos-accent) 0%, var(--macos-accent) ${sliderProgress}%, var(--macos-separator) ${sliderProgress}%, var(--macos-separator) 100%)`,
                      WebkitAppearance: "none",
                    }}
                  />
                  <span className="text-xs text-[var(--macos-text-secondary)] w-12 tabular-nums">
                    {formatTime(effectiveDuration)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsMuted((prev) => !prev)}
                    className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 flex items-center justify-center"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="flex-1 h-2 rounded-full cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, var(--macos-accent) 0%, var(--macos-accent) ${volumeProgress}%, var(--macos-separator) ${volumeProgress}%, var(--macos-separator) 100%)`,
                      WebkitAppearance: "none",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
      </div>

      <audio
        ref={audioRef}
        className="sr-only"
        src={currentTrack?.url}
        playsInline
        preload="metadata"
        onTimeUpdate={(e) => {
          const audio = e.currentTarget;
          setCurrentTime(audio.currentTime);
          setDuration(audio.duration || 0);
        }}
        onLoadedMetadata={(e) => {
          const audio = e.currentTarget;
          setDuration(audio.duration || 0);
        }}
        onDurationChange={(e) => {
          const audio = e.currentTarget;
          setDuration(audio.duration || 0);
        }}
        onPlay={() => {
          setIsPlaying(true);
          shouldAutoAdvanceRef.current = true;
        }}
        onPause={(e) => {
          setIsPlaying(false);
          // If paused not because it ended, treat it as user pause.
          const a = e.currentTarget;
          if (!a.ended) shouldAutoAdvanceRef.current = false;
        }}
        onEnded={() => {
          // Autoplay next only if the user didn't pause.
          if (shouldAutoAdvanceRef.current) {
            playNext();
          } else {
            // Still advance selection, but don't force playback.
            setCurrentIndex((prev) => (tracks.length ? (prev + 1) % tracks.length : prev));
          }
        }}
      />
    </div>
  );
}
