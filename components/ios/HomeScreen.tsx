"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  IoPersonCircleOutline,
  IoRocketOutline,
  IoNewspaperOutline,
  IoCallOutline
} from "react-icons/io5";

interface AppIconProps {
  icon: React.ReactNode;
  label: string;
  gradient?: string;
  delay?: number;
  onClick?: () => void;
}

const AppIcon = ({ icon, label, gradient, delay = 0, onClick }: AppIconProps) => {
  return (
    <motion.button
      className="flex flex-col items-center space-y-2"
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        damping: 15, 
        stiffness: 300, 
        delay 
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div
        className={cn(
          // Responsive icon size
          "w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl",
          // iOS tile treatment: subtle border + shadow + glass
          "ring-1 ring-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-md relative overflow-hidden",
          gradient || "bg-gradient-to-br from-blue-400 to-blue-600",
        )}
        style={{
          background: gradient ? undefined : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          // Fallback tint so tiles remain visible even if gradient utilities are purged
          backgroundColor: gradient ? undefined : 'rgba(255,255,255,0.06)'
        }}
      >
        <span className="filter drop-shadow-sm text-white relative z-[1]">{icon}</span>
      </div>
      <span
        className="inline-block text-white text-[10px] sm:text-xs font-medium text-center leading-tight max-w-16 truncate px-1.5 py-0.5 rounded-md bg-black/35 backdrop-blur-[2px] shadow-sm z-10"
      >
        {label}
      </span>
    </motion.button>
  );
};

interface HomeScreenProps {
  onAppOpen?: (appId: string) => void;
  className?: string;
}

export default function HomeScreen({ onAppOpen, className }: HomeScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);

  const apps = [
    { icon: <IoPersonCircleOutline className="w-7 h-7" />, label: "About", id: "about", gradient: "bg-gradient-to-br from-gray-600 to-gray-800" },
    { icon: <IoRocketOutline className="w-7 h-7" />, label: "Projects", id: "projects", gradient: "bg-gradient-to-br from-purple-500 to-purple-700" },
    { icon: <IoNewspaperOutline className="w-7 h-7" />, label: "Blog", id: "blog", gradient: "bg-gradient-to-br from-yellow-400 to-orange-500" },
    { icon: <Image src="/settings.png" alt="Settings" width={48} height={48} className="w-11 h-11 sm:w-12 sm:h-12 object-contain" priority />, label: "Settings", id: "settings", gradient: "bg-gradient-to-br from-gray-500 to-gray-700" },
  ];

  return (
    <div className={cn(
      // Respect safe areas and adjust paddings per device size
      "flex-1 pt-16 pb-8 px-4 sm:px-6",
      // Prevent page scroll on home screen; windows manage their own scrolling
      "overflow-hidden",
      className
    )}>
      {/* Page indicator dots */}
      <div className="flex justify-center space-x-2 mb-8">
        {[0, 1].map((page) => (
          <motion.div
            key={page}
            className={cn(
              "w-2 h-2 rounded-full transition-all duration-200",
              currentPage === page 
                ? "bg-white" 
                : "bg-white/30"
            )}
            whileTap={{ scale: 0.8 }}
            onClick={() => setCurrentPage(page)}
          />
        ))}
      </div>

      {/* App grid */}
      <div className="grid grid-cols-4 gap-4 sm:gap-6 auto-rows-max">
        {apps.map((app, index) => (
          <AppIcon
            key={app.id}
            icon={app.icon}
            label={app.label}
            gradient={app.gradient}
            delay={index * 0.05}
            onClick={() => onAppOpen?.(app.id)}
          />
        ))}
      </div>

      {/* Dock area - bottom apps */}
      <div className="fixed left-4 right-4 sm:left-6 sm:right-6" style={{ bottom: 'max(16px, calc(env(safe-area-inset-bottom, 0px) + 8px))' }}>
        <div className="rounded-2xl p-0">
          <div className="flex justify-center space-x-4 sm:space-x-6">
            <AppIcon icon={<IoCallOutline className="w-7 h-7" />} label="Contact" gradient="bg-gradient-to-br from-green-500 to-green-700" onClick={() => onAppOpen?.('contact')} />
            <AppIcon icon={<Image src="/discord.png" alt="Discord" width={48} height={48} className="w-11 h-11 sm:w-12 sm:h-12 object-contain" priority />} label="Discord" gradient="bg-gradient-to-br from-indigo-500 to-violet-600" onClick={() => window.open('https://discord.com/invite/dnrfSMgCvV','_blank','noopener,noreferrer')} />
            <AppIcon icon={<Image src="/photos-ios.png" alt="Photos" width={48} height={48} className="w-11 h-11 sm:w-12 sm:h-12 object-contain" priority />} label="Photos" gradient="bg-white" onClick={() => onAppOpen?.('gallery')} />
          </div>
        </div>
      </div>
    </div>
  );
}
