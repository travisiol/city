import { clsx } from "clsx";
import type { ReactNode } from "react";

/** A key on the sheet: mono, tracked out, uppercase. */
export function Label({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={clsx("type-label text-chalk-muted", className)}>
      {children}
    </span>
  );
}

/**
 * Marks the sheet as pre-launch. The figures beside it are a seeded
 * starting state, not readings off the chain — the tag is what keeps the
 * claim count from asserting activity that has not happened yet.
 */
export function PreviewTag({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        "type-label inline-flex items-center gap-1.5 border border-signal/40 bg-signal/10 px-2 py-1 text-signal",
        className,
      )}
    >
      <span className="h-1.5 w-1.5 bg-signal" />
      Pre-launch
    </span>
  );
}
