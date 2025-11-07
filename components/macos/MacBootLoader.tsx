import AppleLogo from "./icons/AppleLogo";

interface MacBootLoaderProps {
  className?: string;
  iconClassName?: string;
  barClassName?: string;
  widthClassName?: string; // e.g. "w-64"
  auto?: boolean; // when true, apply CSS-only auto animation (0 -> ~95%)
  progress?: number; // 0..100 if you want to control manually (no JS)
}

export default function MacBootLoader({
  className,
  iconClassName = "w-16 h-16 text-white",
  barClassName = "h-2 mt-6",
  widthClassName = "w-64",
  auto = true,
  progress,
}: MacBootLoaderProps) {
  const pct = Math.max(0, Math.min(100, typeof progress === "number" ? progress : 0));

  return (
    <div className={className}>
      <div className="flex flex-col items-center">
        <AppleLogo className={iconClassName} />
        <div
          className={`macos-progress ${widthClassName} ${barClassName}`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
        >
          <div
            className={`macos-progress__bar ${auto ? "macos-progress__bar--auto" : ""}`}
            style={typeof progress === "number" ? { width: `${pct}%` } : undefined}
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  );
}


