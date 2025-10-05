import AdaptiveDesktop from "@/components/AdaptiveDesktop";

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* SSR content for crawlers and non-JS */}
      <div className="sr-only">{children}</div>
      {/* Desktop experience overlay */}
      <AdaptiveDesktop />
    </>
  );
}


