"use client";

import type { ImgHTMLAttributes } from "react";

export default function VerticalIcon(props: ImgHTMLAttributes<HTMLImageElement>) {
  // Use the exact brand asset placed in /public
  // Expected file: /public/the-vertical-v.png or /public/the-vertical-v.svg
  // PNG is the default; if you prefer SVG, update the src accordingly.
  const { src = "/the-vertical-v.png", alt = "The Vertical logo", draggable = false, ...rest } = props;
  return <img src={src} alt={alt} draggable={draggable} {...rest} />;
}


