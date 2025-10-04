"use client";

import Image from "next/image";

interface VerticalIconProps {
  className?: string;
  width?: number;
  height?: number;
  draggable?: boolean;
}

export default function VerticalIcon({ className, width = 64, height = 64, draggable = false }: VerticalIconProps) {
  return (
    <Image
      src="/the-vertical-v.png"
      alt="The Vertical logo"
      draggable={draggable}
      width={width}
      height={height}
      className={className}
      priority={false}
    />
  );
}


