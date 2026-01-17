import { NextResponse } from "next/server";
import path from "path";
import { readdir } from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const songsDir = path.join(process.cwd(), "public", "songs");

  try {
    const files = await readdir(songsDir);
    const songs = files
      .filter((file) => file.toLowerCase().endsWith(".mp3"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
      .map((name) => ({
        name,
        url: `/songs/${encodeURIComponent(name)}`,
      }));

    return NextResponse.json(
      { songs },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { songs: [] },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
