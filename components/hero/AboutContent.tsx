"use client";

import Image from "next/image";

// Shared copy pulled from a pure module so we can also server-render it
import { aboutCopy } from "@/lib/aboutCopy";

export default function AboutContent() {
  return (
    <article className="max-w-4xl mx-auto p-6 md:p-8 space-y-8 text-[var(--macos-text-secondary)] bg-[var(--macos-bg-secondary)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--macos-bg-secondary)]/60 rounded-xl">
      <header>
        <div className="mb-4 flex justify-start">
          <Image
            src="/Wanted-Poster.png"
            alt="Wanted poster of Mohammad Dayem Adnan"
            width={320}
            height={400}
            priority
            className="w-40 h-auto rounded-lg shadow-lg"
          />
        </div>
        <h1 className="text-3xl md:text-4xl font-light text-[var(--macos-text-primary)] mb-3">Mohammad Dayem Adnan</h1>
        <p className="text-lg">{aboutCopy.tagline}</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[var(--macos-text-primary)]">About me</h2>
        <p className="text-lg leading-relaxed">{aboutCopy.about1}</p>
        <p className="text-lg leading-relaxed">{aboutCopy.about2}</p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold text-[var(--macos-text-primary)] mb-2">Core Expertise</h3>
          <ul className="list-disc pl-5 space-y-1">
            {aboutCopy.coreExpertise.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-[var(--macos-text-primary)] mb-2">Current Focus</h3>
          <ul className="list-disc pl-5 space-y-1">
            {aboutCopy.currentFocus.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-[var(--macos-text-primary)] mb-2">Selected Wins</h3>
        <ul className="list-disc pl-5 space-y-1">
          {aboutCopy.selectedWins.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </article>
  );
}


