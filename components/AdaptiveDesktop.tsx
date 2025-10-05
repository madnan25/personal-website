"use client";

import { useState, useEffect } from "react";
import MacOSDesktop from "./macos/MacOSDesktop";
import IOSDevice from "./ios/IOSDevice";

export default function AdaptiveDesktop() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkDevice = () => {
      // Check screen size
      const isMobileScreen = window.innerWidth < 768;
      
      // Check if it's a touch device
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Check user agent for mobile indicators
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Combine all checks
      setIsMobile(isMobileScreen || (isTouchDevice && isMobileUserAgent));
      setIsLoading(false);
    };

    // Initial check
    checkDevice();

    // Listen for resize events
    const handleResize = () => {
      checkDevice();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Show loading state briefly to prevent flash
  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Route to iOS experience on mobile/tablet, macOS otherwise
  if (isMobile) {
    return <IOSDevice />;
  }
  return <MacOSDesktop />;
}
