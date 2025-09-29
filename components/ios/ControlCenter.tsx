"use client";

import { motion, PanInfo } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ControlCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const ControlButton = ({ 
  icon, 
  label, 
  isActive = false, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  isActive?: boolean;
  onClick?: () => void;
}) => (
  <motion.button
    className={cn(
      "flex flex-col items-center justify-center p-4 rounded-2xl",
      "transition-all duration-200",
      isActive 
        ? "bg-blue-500 text-white" 
        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
    )}
    onClick={onClick}
    whileTap={{ scale: 0.95 }}
  >
    <div className="mb-2">{icon}</div>
    <span className="text-xs font-medium">{label}</span>
  </motion.button>
);

export default function ControlCenter({ isOpen, onClose }: ControlCenterProps) {
  const [brightness, setBrightness] = useState(80);
  const [volume, setVolume] = useState(60);
  const [wifiEnabled, setWifiEnabled] = useState(true);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(true);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y < -100) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
      />

      {/* Control Center Panel */}
      <motion.div
        className="absolute top-12 right-4 left-4 bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl"
        initial={{ y: -400, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -400, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center mb-4">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Main Controls Grid */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <ControlButton
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.07 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
              </svg>
            }
            label="WiFi"
            isActive={wifiEnabled}
            onClick={() => setWifiEnabled(!wifiEnabled)}
          />
          
          <ControlButton
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.71 7.71L12 2h-1v7.59L6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 11 14.41V22h1l5.71-5.71-4.3-4.29 4.3-4.29z"/>
              </svg>
            }
            label="Bluetooth"
            isActive={bluetoothEnabled}
            onClick={() => setBluetoothEnabled(!bluetoothEnabled)}
          />
          
          <ControlButton
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v3h2V3h12v18H4v-3H2v3c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zM8.5 15.5l1.09-2.09L12 15l2.41-1.59L15.5 15.5 12 18l-3.5-2.5zm0-7L12 6l3.5 2.5-1.09 1.59L12 9l-2.41 1.59L8.5 8.5z"/>
              </svg>
            }
            label="AirDrop"
          />
          
          <ControlButton
            icon={
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            }
            label="Personal Hotspot"
          />
        </div>

        {/* Brightness Control */}
        <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
          <div className="flex items-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-600">
              <path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>
            </svg>
            <span className="ml-3 text-sm font-medium text-gray-700">Brightness</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        {/* Volume Control */}
        <div className="p-4 bg-gray-50 rounded-2xl">
          <div className="flex items-center mb-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="text-gray-600">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <span className="ml-3 text-sm font-medium text-gray-700">Volume</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>

        <style jsx>{`
          .slider::-webkit-slider-thumb {
            appearance: none;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #007AFF;
            cursor: pointer;
          }
          .slider::-moz-range-thumb {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: #007AFF;
            cursor: pointer;
            border: none;
          }
        `}</style>
      </motion.div>
    </motion.div>
  );
}
