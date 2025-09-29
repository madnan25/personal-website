"use client";

import { motion, PanInfo } from "framer-motion";
import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

interface AppWindowProps {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  backgroundColor?: string;
}

export default function AppWindow({ 
  title, 
  children, 
  isOpen, 
  onClose, 
  className,
  backgroundColor = "bg-white"
}: AppWindowProps) {
  const [dragY, setDragY] = useState(0);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 150) {
      onClose();
    }
    setDragY(0);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed inset-0 z-40"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20"
        onClick={onClose}
      />

      {/* App Window */}
      <motion.div
        className={cn(
          "absolute inset-x-0 bottom-0 top-20",
          "rounded-t-3xl shadow-2xl",
          backgroundColor,
          className
        )}
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        style={{ y: dragY }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100">
          <h1 className="text-xl font-semibold text-gray-900">
            {title}
          </h1>
          <motion.button
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            onClick={onClose}
            whileTap={{ scale: 0.9 }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M13 1L1 13M1 1L13 13"
                stroke="#666"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}
