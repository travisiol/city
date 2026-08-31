import { clsx } from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

/*
 * One filled button, in claim-orange, because pressing it is the act the
 * whole page exists for. Everything else is an outline.
 */
const base =
  "type-label inline-flex items-center justify-center gap-2 px-4 py-3 transition-colors duration-150 disabled:cursor-not-allowed";

export function Button({
  children,
  variant = "solid",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "solid" | "outline";
}) {
  return (
    <button
      type="button"
      className={clsx(
        base,
        variant === "solid"
          ? "bg-signal text-void hover:bg-signal-bright disabled:bg-transparent disabled:text-chalk-muted disabled:ring-1 disabled:ring-rule-strong disabled:ring-inset"
          : "text-chalk ring-1 ring-rule-strong ring-inset hover:bg-chalk hover:text-void disabled:text-chalk-muted",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  href,
  className,
}: {
  children: ReactNode;
  href: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={clsx(
        base,
        "bg-signal text-void hover:bg-signal-bright",
        className,
      )}
    >
      {children}
    </a>
  );
}
