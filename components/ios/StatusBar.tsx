"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useBattery } from "../macos/hooks/useBattery";

interface StatusBarProps {
  className?: string;
}

export default function StatusBar({ className }: StatusBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const battery = useBattery();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <motion.div
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "px-6",
        "flex items-center justify-between",
        "text-white text-sm font-semibold",
        className
      )}
      initial={{ y: -44 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      style={{
        height: 'calc(44px + env(safe-area-inset-top, 0px))',
        paddingTop: 'env(safe-area-inset-top, 0px)'
      }}
    >
      {/* Left side - Time */}
      <div className="text-base font-semibold">
        {formatTime(currentTime)}
      </div>

      {/* Right side - Status icons */}
      <div className="flex items-center space-x-1">
        {/* Signal */}
        <div className="flex items-center space-x-1">
          <div className="flex items-end space-x-0.5">
            {[1, 2, 3, 4].map((bar) => (
              <div
                key={bar}
                className={cn(
                  "w-0.5 bg-white rounded-full",
                  bar === 1 ? "h-1" : bar === 2 ? "h-1.5" : bar === 3 ? "h-2" : "h-2.5"
                )}
              />
            ))}
          </div>
        </div>

        {/* WiFi */}
        <div className="ml-2">
          <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
            <path
              d="M7.5 11C8.05 11 8.5 10.55 8.5 10S8.05 9 7.5 9 6.5 9.45 6.5 10 6.95 11 7.5 11ZM12.3 6.2C10.88 4.78 8.78 4 7.5 4S4.12 4.78 2.7 6.2L3.41 6.91C4.59 5.73 6.14 5.1 7.5 5.1S10.41 5.73 11.59 6.91L12.3 6.2ZM15 3.5C13.07 1.57 10.38 0.5 7.5 0.5S1.93 1.57 0 3.5L0.71 4.21C2.4 2.52 4.84 1.6 7.5 1.6S12.6 2.52 14.29 4.21L15 3.5Z"
              fill="white"
            />
          </svg>
        </div>

        {/* Battery */}
        <div className="ml-1 flex items-center">
          <div className="relative">
            <div className="w-6 h-3 border border-white rounded-sm overflow-hidden">
              <div
                className="h-full bg-white"
                style={{ width: `${Math.round(((battery.level ?? 1) * 100))}%` }}
              />
            </div>
            <div className="absolute -right-0.5 top-1 w-0.5 h-1 bg-white rounded-r-sm" />
          </div>
          <span className="ml-1 text-xs">
            {battery.level !== null ? Math.round(battery.level * 100) : 100}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
