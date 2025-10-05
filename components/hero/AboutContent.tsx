"use client";

export default function AboutContent() {
  return (
    <article className="max-w-4xl mx-auto p-6 md:p-8 space-y-8 text-[var(--macos-text-secondary)] bg-[var(--macos-bg-secondary)]/80 backdrop-blur supports-[backdrop-filter]:bg-[var(--macos-bg-secondary)]/60 rounded-xl">
      <header>
        <h1 className="text-3xl md:text-4xl font-light text-[var(--macos-text-primary)] mb-3">Mohammad Dayem Adnan</h1>
        <p className="text-lg">I build teams, products, and repeatable wins.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-[var(--macos-text-primary)]">About me</h2>
        <p className="text-lg leading-relaxed">I’m a builder who loves turning ideas into working systems—brands that resonate, products people use, and campaigns that actually pay for themselves. I’ve managed $1.2M/year in marketing budgets and shipped programs that turn $30k into $2.6M in revenue (~86× ROAS).</p>
        <p className="text-lg leading-relaxed">Right now I wear three hats: CMO at The Vertical, Founder at Voortgang, and Head of Delivery at NettaWorks. I’m happiest when I’m building—applying design thinking, ruthless prioritization, and tight feedback loops to deliver results.</p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-semibold text-[var(--macos-text-primary)] mb-2">Core Expertise</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Growth Marketing</li>
            <li>UX/UI</li>
            <li>Product Design</li>
            <li>Product Management</li>
            <li>Team Leadership &amp; Org Design</li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-[var(--macos-text-primary)] mb-2">Current Focus</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Chief Marketing Officer, The Vertical — scaling brand equity and pipeline</li>
            <li>Founder, Voortgang — building practical, innovative tools and experiences</li>
            <li>Head of Delivery, NettaWorks — getting complex projects over the line</li>
          </ul>
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold text-[var(--macos-text-primary)] mb-2">Selected Wins</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>$1.2M annual budget managed across brand, performance, and content</li>
          <li>$30k → $2.6M campaign outcome (~86× ROAS) with disciplined creative + media ops</li>
          <li>Best Real Estate Brand — helped The Vertical win at Global Digital Awards</li>
        </ul>
      </section>
    </article>
  );
}


