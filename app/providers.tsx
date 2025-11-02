"use client";

import { ThemeProvider } from "next-themes";
import { ReactNode, useEffect, useRef } from "react";

type ProvidersProps = {
  children: ReactNode;
};

function TitleGhost() {
  const RUDE = "👻 rude";
  const baselineTitleRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const titleElement = document.querySelector("title");

    const setBaselineIfNeeded = () => {
      if (!document.hidden && document.title !== RUDE) {
        baselineTitleRef.current = document.title;
      }
    };

    // Initialize baseline on mount
    setBaselineIfNeeded();

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (document.title !== RUDE) {
          baselineTitleRef.current = document.title;
        }
        document.title = RUDE;
      } else {
        if (document.title === RUDE) {
          document.title = baselineTitleRef.current !== undefined ? baselineTitleRef.current : "";
        }
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    // Track title changes while visible so we always restore the latest title
    let observer: MutationObserver | null = null;
    if (titleElement) {
      observer = new MutationObserver(() => {
        setBaselineIfNeeded();
      });
      observer.observe(titleElement, { childList: true, characterData: true, subtree: true });
    }

    // Apply initial state if the page starts hidden
    if (document.hidden) onVisibilityChange();

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (observer) observer.disconnect();
    };
  }, []);

  return null;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      <TitleGhost />
      {children}
    </ThemeProvider>
  );
}


