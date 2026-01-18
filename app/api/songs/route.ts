import { NextResponse } from "next/server";
import path from "path";
import { readdir, stat } from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const normalizeKey = (name: string) =>
  name
    .toLowerCase()
    .replace(/\.[^/.]+$/, "")
    .replace(/\s+/g, " ")
    .trim();

const SONG_DESCRIPTIONS: Record<string, string> = {
  [normalizeKey("Ask it twice.mp3")]:
    "“Ask It Twice” is a sharp, philosophy-meets-execution anthem about refusing to rent belief on hype. Using Socrates, falling empires, revolutions, and the patience of Newton and Einstein, it argues that real builders don’t move fast just to feel ahead—they pressure-test ideas until only what’s structurally true survives. The hook is the rule: ask it twice (then again), strip it bare, and only let in what still stands without applause.",
  [normalizeKey("Marketing Final.mp3")]:
    "“Marketing Final” is a tired-but-triumphant workplace anthem about nights that quietly turn into mornings inside a marketing office. With humor, chai, Slack pings, last-minute edits, and a punch machine that flips from check-out to check-in, the song captures the blurred line between day and night, work and home. It celebrates the chaos, camaraderie, and quiet pride of a team that keeps building brands while the rest of the city sleeps—half exhausted, half alive, and fully committed.",
  [normalizeKey("It clicked late.mp3")]:
    "“It Clicked Late” is a slow-burn realization song about mistaking discipline for obstruction. Told from the perspective of a frustrated team member, it traces the shift from irritation at endless questions and delayed wins to the moment outcomes begin to compound quietly. What once felt like momentum-killing silence is revealed as noise-killing clarity—proof that some leadership only makes sense in hindsight.",
  [normalizeKey("Silly Goose.mp3")]:
    "“Silly Goose” is a light-hearted, self-deprecating ode to being perpetually tired, slightly lost, and still oddly functional. Through sleepy humor, everyday mishaps, and goose-mode metaphors, the song turns burnout, brain fog, and social awkwardness into something endearing—celebrating survival by vibes, snacks, and a lot of gentle honking through life.",
};

export async function GET() {
  const songsDir = path.join(process.cwd(), "public", "songs");

  try {
    const files = await readdir(songsDir);
    const MIN_BYTES = 4_096; // guard against incomplete uploads (e.g. empty files)

    const { parseBuffer } = await import("music-metadata");

    const entries = await Promise.all(
      files
        .filter((file) => file.toLowerCase().endsWith(".mp3"))
        .map(async (name) => {
          const full = path.join(songsDir, name);
          const s = await stat(full).catch(() => null);
          let durationSeconds: number | null = null;
          let hasCover = false;
          if ((s?.size ?? 0) >= MIN_BYTES) {
            try {
              // Parse local file once on the server. This is fast and avoids client-side MP3 probing.
              const { readFile } = await import("fs/promises");
              const buf = await readFile(full);
              const meta = await parseBuffer(buf, "audio/mpeg", { duration: true });
              durationSeconds = typeof meta.format.duration === "number" && Number.isFinite(meta.format.duration) ? meta.format.duration : null;
              hasCover = Boolean(meta.common.picture?.length);
            } catch {
              durationSeconds = null;
              hasCover = false;
            }
          }
          return {
            name,
            url: `/songs/${encodeURIComponent(name)}`,
            description: SONG_DESCRIPTIONS[normalizeKey(name)] ?? null,
            size: s?.size ?? 0,
            durationSeconds,
            coverUrl: hasCover ? `/api/songs/cover?name=${encodeURIComponent(name)}` : null,
          };
        })
    );

    const songs = entries
      .filter((s) => s.size >= MIN_BYTES)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: "base" }))
      .map(({ size, ...rest }) => rest);

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
