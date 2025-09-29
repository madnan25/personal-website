"use client";

import { useCallback, useRef, useState } from "react";

export type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

interface UseWindowResizeOptions {
  minWidth: number;
  minHeight: number;
  initialWidth: number;
  initialHeight: number;
  getPosition: () => { x: number; y: number };
  setPosition: (pos: { x: number; y: number }) => void;
}

export function useWindowResize({
  minWidth,
  minHeight,
  initialWidth,
  initialHeight,
  getPosition,
  setPosition
}: UseWindowResizeOptions) {
  const [width, setWidth] = useState<number>(initialWidth);
  const [height, setHeight] = useState<number>(initialHeight);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const frame = useRef<number | null>(null);

  const startResize = useCallback((dir: ResizeDir, ev: React.MouseEvent) => {
    ev.preventDefault();
    ev.stopPropagation();
    setIsResizing(true);

    const startX = ev.clientX;
    const startY = ev.clientY;
    const startWidth = width;
    const startHeight = height;
    const { x, y } = getPosition();
    const startPosX = x;
    const startPosY = y;

    const onMove = (e: MouseEvent) => {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startPosX;
        let newY = startPosY;

        if (dir.includes('e')) newWidth = Math.max(minWidth, startWidth + dx);
        if (dir.includes('s')) newHeight = Math.max(minHeight, startHeight + dy);
        if (dir.includes('w')) { newWidth = Math.max(minWidth, startWidth - dx); newX = startPosX + (startWidth - newWidth); }
        if (dir.includes('n')) { newHeight = Math.max(minHeight, startHeight - dy); newY = startPosY + (startHeight - newHeight); }

        const vw = window.innerWidth; const vh = window.innerHeight;
        newWidth = Math.min(newWidth, vw); newHeight = Math.min(newHeight, vh);

        setWidth(newWidth); setHeight(newHeight); setPosition({ x: newX, y: newY });
      });
    };

    const onUp = () => {
      setIsResizing(false);
      if (frame.current) cancelAnimationFrame(frame.current);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [getPosition, height, minHeight, minWidth, setPosition, width]);

  return { width, height, isResizing, startResize, setWidth, setHeight };
}


