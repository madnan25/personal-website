"use client";

import { useState, useEffect } from "react";
import MacOSDesktop from "./macos/MacOSDesktop";
import IOSDevice from "./ios/IOSDevice";

export default function AdaptiveDesktop() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const checkDevice = () => {
      // Check screen size
      const isMobileScreen = window.innerWidth < 768;
      
      // Check if it's a touch device
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Check user agent for mobile indicators
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Combine all checks
      const result = isMobileScreen || (isTouchDevice && isMobileUserAgent);
      setIsMobile(result);
    };

    // Initial check
    checkDevice();

    // Listen for resize events
    const handleResize = () => {
      checkDevice();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // During very first client computation, render SSR-friendly macOS loader
  if (isMobile === null) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center">
          {/* Inline Apple logo SVG to avoid client/server import boundaries */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 256 315"
            className="w-16 h-16 text-white"
            aria-label="Apple"
          >
            <path
              fill="currentColor"
              d="M213.803 167.508c-.397-40.786 33.323-60.397 34.83-61.323-18.96-27.716-48.46-31.546-58.876-31.972-25.056-2.54-48.84 14.635-61.52 14.635-12.68 0-32.276-14.29-53.095-13.902-27.34.4-52.526 15.88-66.57 40.34-28.26 48.996-7.2 121.41 20.3 161.164 13.416 19.3 29.336 40.94 50.192 40.12 20.13-.8 27.748-12.96 52.072-12.96 24.328 0 31.106 12.96 52.32 12.56 21.68-.4 35.44-19.66 48.656-38.98 15.34-22.82 21.68-44.86 22.08-45.96-.48-.24-42.3-16.2-42.39-63.72Zm-39.8-115.64c11.28-13.68 18.88-32.7 16.8-51.868-16.24.64-35.86 10.84-47.48 24.52-10.44 12.08-19.54 31.46-17.12 50.04 18.08 1.4 36.52-9.16 47.8-22.692Z"
            />
          </svg>
          <div className="macos-progress w-64 h-2 mt-6">
            <div className="macos-progress__bar macos-progress__bar--auto" />
          </div>
        </div>
      </div>
    );
  }

  // Route to iOS experience on mobile/tablet, macOS otherwise
  return isMobile ? <IOSDevice /> : <MacOSDesktop />;
}
