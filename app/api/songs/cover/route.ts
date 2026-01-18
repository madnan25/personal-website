import { NextResponse } from "next/server";
import path from "path";
import { readFile, stat } from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const safeName = (name: string) => {
  // Reject traversal and weird encodings; allow spaces.
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) return null;
  if (!name.toLowerCase().endsWith(".mp3")) return null;
  return name;
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const name = safeName(searchParams.get("name") || "");
  if (!name) return new NextResponse("Bad Request", { status: 400 });

  const songsDir = path.join(process.cwd(), "public", "songs");
  const fullPath = path.join(songsDir, name);

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

