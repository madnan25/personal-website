import { NextResponse } from "next/server";
import path from "path";
import { readFile, stat } from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const songsDir = path.resolve(process.cwd(), "public", "songs");

export function resolveSongPathFromDir(dir: string, name: string): string | null {
  if (!name || !name.toLowerCase().endsWith(".mp3")) return null;
  const resolved = path.resolve(dir, name);
  // Must be a direct child of the songs directory (no subdirectories, no escape).
  if (path.dirname(resolved) !== dir) return null;
  return resolved;
}

const resolveSongPath = (name: string): string | null => resolveSongPathFromDir(songsDir, name);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fullPath = resolveSongPath(searchParams.get("name") || "");
  if (!fullPath) return new NextResponse("Bad Request", { status: 400 });

  try {
    // Guard against tiny/invalid files
    const s = await stat(fullPath);
    if (s.size < 4096) return new NextResponse("Not Found", { status: 404 });

    // music-metadata works best with a Buffer; avoid bundling streams here.
    const { parseBuffer } = await import("music-metadata");
    const buf = await readFile(fullPath);
    const meta = await parseBuffer(buf, "audio/mpeg", { duration: false });
    const pic = meta.common.picture?.[0];
    if (!pic) return new NextResponse("Not Found", { status: 404 });

    const body = Buffer.from(pic.data);
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": pic.format || "image/jpeg",
        // Cache aggressively; covers change rarely.
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not Found", { status: 404 });
  }
}

