"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface AppIconProps {
  icon: string;
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
          "w-16 h-16 rounded-2xl flex items-center justify-center text-2xl",
          "shadow-lg",
          gradient || "bg-gradient-to-br from-blue-400 to-blue-600"
        )}
        style={{
          background: gradient ? undefined : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <span className="filter drop-shadow-sm">{icon}</span>
      </div>
      <span className="text-white text-xs font-medium text-center leading-tight max-w-16 truncate">
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
    { 
      icon: "👤", 
      label: "About", 
      id: "about",
      gradient: "bg-gradient-to-br from-gray-600 to-gray-800"
    },
    { 
      icon: "🎨", 
      label: "Portfolio", 
      id: "portfolio",
      gradient: "bg-gradient-to-br from-purple-500 to-purple-700"
    },
    { 
      icon: "🚀", 
      label: "Projects", 
      id: "projects",
      gradient: "bg-gradient-to-br from-orange-500 to-red-600"
    },
    { 
      icon: "📝", 
      label: "Blog", 
      id: "blog",
      gradient: "bg-gradient-to-br from-yellow-400 to-orange-500"
    },
    { 
      icon: "💼", 
      label: "Resume", 
      id: "resume",
      gradient: "bg-gradient-to-br from-blue-500 to-blue-700"
    },
    { 
      icon: "📧", 
      label: "Contact", 
      id: "contact",
      gradient: "bg-gradient-to-br from-green-500 to-green-700"
    },
    { 
      icon: "⚙️", 
      label: "Settings", 
      id: "settings",
      gradient: "bg-gradient-to-br from-gray-500 to-gray-700"
    },
    { 
      icon: "📱", 
      label: "Social", 
      id: "social",
      gradient: "bg-gradient-to-br from-pink-500 to-red-500"
    },
    { 
      icon: "🎵", 
      label: "Music", 
      id: "music",
      gradient: "bg-gradient-to-br from-red-500 to-pink-600"
    },
    { 
      icon: "📷", 
      label: "Photos", 
      id: "photos",
      gradient: "bg-gradient-to-br from-yellow-400 to-yellow-600"
    },
    { 
      icon: "🌤️", 
      label: "Weather", 
      id: "weather",
      gradient: "bg-gradient-to-br from-blue-400 to-cyan-500"
    },
    { 
      icon: "🗺️", 
      label: "Maps", 
      id: "maps",
      gradient: "bg-gradient-to-br from-green-400 to-green-600"
    },
  ];

  return (
    <div className={cn(
      "flex-1 pt-16 pb-8 px-6",
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
      <div className="grid grid-cols-4 gap-6 auto-rows-max">
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
      <div className="fixed bottom-8 left-6 right-6">
        <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-3">
          <div className="flex justify-center space-x-6">
            <AppIcon
              icon="📞"
              label="Phone"
              gradient="bg-gradient-to-br from-green-500 to-green-700"
              onClick={() => onAppOpen?.('phone')}
            />
            <AppIcon
              icon="💬"
              label="Messages"
              gradient="bg-gradient-to-br from-green-400 to-green-600"
              onClick={() => onAppOpen?.('messages')}
            />
            <AppIcon
              icon="🌐"
              label="Safari"
              gradient="bg-gradient-to-br from-blue-500 to-blue-700"
              onClick={() => onAppOpen?.('safari')}
            />
            <AppIcon
              icon="🎵"
              label="Spotify"
              gradient="bg-gradient-to-br from-green-500 to-green-700"
              onClick={() => onAppOpen?.('spotify')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
