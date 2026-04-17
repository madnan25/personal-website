import Link from "next/link";
import { aboutCopy } from "@/lib/aboutCopy";

export default function HomeStub() {
  return (
    <article>
      <h1>Mohammad Dayem Adnan</h1>
      <p>{aboutCopy.tagline}</p>
      <p>{aboutCopy.about1}</p>
      <nav aria-label="Primary">
        <ul>
          <li><Link href="/about">About</Link></li>
          <li><Link href="/blog">Blog</Link></li>
        </ul>
      </nav>
    </article>
  );
}
