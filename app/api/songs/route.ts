import { NextResponse } from "next/server";
import path from "path";
import { readdir } from "fs/promises";

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
};

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
        description: SONG_DESCRIPTIONS[normalizeKey(name)] ?? null,
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
