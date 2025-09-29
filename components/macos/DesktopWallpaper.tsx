"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface DesktopWallpaperProps {
  className?: string;
  imageSrc?: string; // supports "/path.jpg" or "gradient:<id>"
  imageAlt?: string;
}

export function GradientBackground({ id }: { id: string }) {
  // A few Apple-inspired gradients
  if (id === 'big-sur') {
    return (
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600" />
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-900/30 via-transparent to-purple-900/20" />
      </div>
    );
  }
  if (id === 'monterey') {
    return (
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-400 via-blue-500 to-fuchsia-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/30 via-transparent to-fuchsia-900/20" />
      </div>
    );
  }
  if (id === 'sonoma') {
    return (
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-sky-400 to-rose-400" />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 via-transparent to-rose-900/20" />
      </div>
    );
  }
  // Default gradient (previous fallback)
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500" />
      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 via-transparent to-purple-900/20" />
    </div>
  );
}

export default function DesktopWallpaper({ className, imageSrc, imageAlt = "Desktop wallpaper" }: DesktopWallpaperProps) {
  return (
    <div className={cn("fixed inset-0 -z-10", className)}>
      {/* Image or gradient background */}
      {imageSrc ? (
        imageSrc.startsWith('gradient:') ? (
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <GradientBackground id={imageSrc.replace('gradient:', '')} />
            <div className="absolute inset-0 bg-black/10" />
            <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/20" />
          </motion.div>
        ) : (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.05, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          {/* Subtle darken to keep UI legible */}
          <div className="absolute inset-0 bg-black/20" />
          {/* Vignette */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/25" />
        </motion.div>
        )
      ) : (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          {/* Base gradient fallback */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 via-transparent to-purple-900/20" />
          {/* Subtle noise texture overlay */}
          <div 
            className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/10" />
        </motion.div>
      )}
    </div>
  );
}
