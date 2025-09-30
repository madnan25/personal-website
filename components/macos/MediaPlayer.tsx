"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";

interface MediaPlayerProps {
  videoId: string;
  className?: string;
}

export default function MediaPlayer({ videoId, className }: MediaPlayerProps) {
  const containerId = `yt-player-${videoId}`;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const createPlayer = () => {
      const YT = (window as any).YT;
      if (!YT || !YT.Player) return;
      
      // Create player that fills the container
      playerRef.current = new YT.Player(containerId, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          controls: 0,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          playsinline: 1,
          enablejsapi: 1,
          fs: 0,
        },
        events: {
          onReady: (e: any) => {
            e.target.setVolume(volume);
            setDuration(e.target.getDuration ? e.target.getDuration() : 0);
            e.target.playVideo();
            setIsPlaying(true);
          },
          onStateChange: (e: any) => {
            setIsPlaying(e.data === 1);
            if (playerRef.current?.getDuration) {
              setDuration(playerRef.current.getDuration() || 0);
            }
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) createPlayer();
    else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      (window as any).onYouTubeIframeAPIReady = () => createPlayer();
      document.body.appendChild(tag);
    }

    // Progress polling (every 250ms)
    if (!timerRef.current) {
      timerRef.current = window.setInterval(() => {
        const p = playerRef.current;
        if (p && p.getCurrentTime) {
          const ct = p.getCurrentTime() || 0;
          setCurrentTime(ct);
          if (p.getDuration) setDuration(p.getDuration() || 0);
        }
      }, 250) as unknown as number;
    }

    return () => {
      try { playerRef.current?.destroy?.(); } catch {}
      if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [videoId]);

  const playPause = () => {
    const p = playerRef.current; if (!p) return;
    if (isPlaying) p.pauseVideo(); else p.playVideo();
  };
  const seekBy = (delta: number) => {
    const p = playerRef.current; if (!p) return;
    const cur = p.getCurrentTime ? p.getCurrentTime() : 0;
    p.seekTo(Math.max(0, cur + delta), true);
  };
  const toggleMute = () => {
    const p = playerRef.current; if (!p) return;
    if (p.isMuted && p.isMuted()) { p.unMute(); setIsMuted(false); } else { p.mute(); setIsMuted(true); }
  };
  const changeVolume = (v: number) => {
    setVolume(v); const p = playerRef.current; if (!p) return; if (p.setVolume) p.setVolume(v);
  };
  const changeRate = (rate: number) => {
    setPlaybackRate(rate); const p = playerRef.current; if (!p) return; if (p.setPlaybackRate) p.setPlaybackRate(rate);
  };

  // Prevent window drag on all pointer events (capture phase to beat framer-motion)
  const preventDragCapture = (e: any) => {
    e.stopPropagation();
  };

  const formatTime = (s: number) => {
    const total = Math.max(0, Math.floor(s));
    const mm = Math.floor(total / 60).toString();
    const ss = (total % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const handleSeek = (v: number) => {
    const p = playerRef.current; if (!p) return;
    setCurrentTime(v);
    if (p.seekTo) p.seekTo(v, true);
  };

  return (
    <div className="h-full w-full flex flex-col p-4">
      {/* Video player - fills available space minus controls */}
      <div className="relative flex-1 bg-black rounded-lg overflow-hidden border border-[var(--macos-border)] shadow-2xl">
        {/* YouTube iframe will be injected here and styled to fill */}
        <div 
          id={containerId} 
          className="w-full h-full"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
        <style jsx>{`
          #${containerId} iframe {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border: none;
          }
        `}</style>
      </div>
    
      {/* External controls bar - prevent window drag */}
      <div 
        className="mt-3 bg-[var(--macos-surface)]/90 border border-[var(--macos-border)] rounded-lg shadow-lg px-4 py-3 backdrop-blur-md"
        onPointerDownCapture={preventDragCapture}
        onMouseDownCapture={preventDragCapture}
        onTouchStartCapture={preventDragCapture}
      >
        {/* Progress row */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs text-[var(--macos-text-secondary)] w-12 text-right">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={Math.max(1, Math.floor(duration))}
            value={Math.floor(currentTime)}
            onChange={(e) => handleSeek(Number(e.target.value))}
            onPointerDownCapture={preventDragCapture}
            className="flex-1 h-2 rounded-full cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--macos-accent) 0%, var(--macos-accent) ${duration ? (currentTime/duration)*100 : 0}%, var(--macos-separator) ${duration ? (currentTime/duration)*100 : 0}%, var(--macos-separator) 100%)`,
              WebkitAppearance: 'none',
            }}
          />
          <span className="text-xs text-[var(--macos-text-secondary)] w-12">{formatTime(duration)}</span>
        </div>

        {/* Controls row */}
        <div className="grid grid-cols-3 items-center gap-4">
          {/* Left: Volume */}
          <div className="flex items-center gap-2 min-w-0 w-full justify-self-start">
            <button
              onClick={toggleMute}
              onPointerDownCapture={preventDragCapture}
              className="h-10 w-10 rounded hover:bg-[var(--macos-surface)] text-[var(--macos-text-primary)] transition-colors flex items-center justify-center flex-shrink-0"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => changeVolume(Number(e.target.value))}
              onPointerDownCapture={preventDragCapture}
              className="w-full h-1.5 rounded-full cursor-pointer min-w-0"
              style={{
                background: `linear-gradient(to right, var(--macos-accent) 0%, var(--macos-accent) ${volume}%, var(--macos-separator) ${volume}%, var(--macos-separator) 100%)`,
                WebkitAppearance: 'none',
              }}
            />
          </div>

          {/* Center: Transport controls */}
          <div className="col-start-2 flex items-center justify-center gap-3 justify-self-center">
            <button 
              onClick={() => seekBy(-10)}
              onPointerDownCapture={preventDragCapture}
              className="h-10 w-10 rounded-lg hover:bg-[var(--macos-surface)] text-[var(--macos-text-primary)] transition-colors flex items-center justify-center"
              aria-label="Skip back 10 seconds"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            <button 
              onClick={playPause}
              onPointerDownCapture={preventDragCapture}
              className="h-10 w-10 rounded-lg bg-[var(--macos-accent)] text-white hover:bg-[var(--macos-accent-hover)] transition-all shadow-md flex items-center justify-center"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <button 
              onClick={() => seekBy(10)}
              onPointerDownCapture={preventDragCapture}
              className="h-10 w-10 rounded-lg hover:bg-[var(--macos-surface)] text-[var(--macos-text-primary)] transition-colors flex items-center justify-center"
              aria-label="Skip forward 10 seconds"
            >
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          {/* Right: Playback speed */}
          <div className="flex items-center gap-2 justify-end pl-2 min-w-0 w-full justify-self-end">
            <label className="text-xs text-[var(--macos-text-secondary)] font-medium">Speed</label>
            <select
              value={playbackRate}
              onChange={(e) => changeRate(Number(e.target.value))}
              onPointerDownCapture={preventDragCapture}
              className="bg-[var(--macos-surface)] border border-[var(--macos-border)] rounded-lg px-3 py-1.5 text-[13px] text-[var(--macos-text-primary)] hover:border-[var(--macos-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--macos-accent)]/50 transition-all cursor-pointer"
            >
              <option value={1}>1×</option>
              <option value={2}>2×</option>
              <option value={4}>4×</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
