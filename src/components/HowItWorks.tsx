import type { ReactNode } from "react";
import { Label } from "@/components/ui/Label";

/*
 * Four beats, each in a hex frame with a chevron between them, so the
 * sequence reads as a chain before a word is parsed. The glyphs are drawn
 * rather than illustrated — a flag for taking ground, a split hexagon for
 * the share, a rising market, a coin coming back — which keeps them in the
 * same line language as the map.
 */

function HexFrame({ children }: { children: ReactNode }) {
  return (
    <span className="relative inline-flex h-20 w-[72px] items-center justify-center">
      <svg
        viewBox="0 0 72 80"
        className="absolute inset-0 h-full w-full text-signal"
        aria-hidden
      >
        <path
          d="M36 2 L69 21 V59 L36 78 L3 59 V21 Z"
          fill="rgba(242,167,27,0.08)"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
      <span className="relative text-signal">{children}</span>
    </span>
  );
}

/** 1 — a flag planted: taking a position on a city. */
function FlagGlyph() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
      <path d="M8 4 V26" stroke="currentColor" strokeWidth="2.4" />
      <path d="M8 5 H23 L19 11 L23 17 H8 Z" fill="currentColor" />
    </svg>
  );
}

/** 2 — one hexagon divided: the share, not the whole. */
function ShareGlyph() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
      <defs>
        <clipPath id="hiw-share-clip">
          <path d="M15 2 L27 9 V21 L15 28 L3 21 V9 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#hiw-share-clip)">
        <rect x="3" y="2" width="24" height="9" fill="currentColor" />
        <rect
          x="3"
          y="11"
          width="24"
          height="17"
          fill="currentColor"
          opacity="0.3"
        />
      </g>
      <path
        d="M15 2 L27 9 V21 L15 28 L3 21 V9 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

/** 3 — the market growing as more people buy in. */
function GrowthGlyph() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
      <rect x="3" y="18" width="5" height="9" fill="currentColor" opacity="0.5" />
      <rect x="11" y="12" width="5" height="15" fill="currentColor" opacity="0.75" />
      <rect x="19" y="5" width="5" height="22" fill="currentColor" />
    </svg>
  );
}

/** 4 — fees coming back to the holders. */
function RewardGlyph() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" aria-hidden>
      <circle
        cx="15"
        cy="15"
        r="11"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
      />
      <path
        d="M15 8 V22 M11 11.5 H18 M11 18.5 H18"
        stroke="currentColor"
        strokeWidth="2.2"
        fill="none"
      />
    </svg>
  );
}

const steps = [
  {
    index: "1",
    title: "Choose a city",
    body: "Explore the map and find a city you believe in.",
    Glyph: FlagGlyph,
  },
  {
    index: "2",
    title: "Buy a share",
    body: "Purchase a share of any city on the market — as much or as little as you want.",
    Glyph: ShareGlyph,
  },
  {
    index: "3",
    title: "The market grows",
    body: "Other people buy and sell the same city. Activity and demand move its price.",
    Glyph: GrowthGlyph,
  },
  {
    index: "4",
    title: "Earn from activity",
    body: "Trading fees are split between holders in proportion to what each one holds.",
    Glyph: RewardGlyph,
  },
] as const;

export function HowItWorks() {
  return (
    <section
      id="how"
      className="scroll-mt-16 border-b border-rule px-4 py-16 sm:px-6"
    >
      <Label className="mb-3 block text-signal">How it works</Label>
      <h2 className="type-display mb-3 text-chalk">
        Every city is its own economy
      </h2>
      <p className="type-body mb-12 max-w-[64ch] text-chalk-soft">
        One map, hundreds of independent markets. Here is the whole mechanic.
      </p>

      <ol className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {steps.map(({ index, title, body, Glyph }, position) => (
          <li
            key={index}
            className="flex flex-1 items-start gap-6 lg:flex-col lg:items-stretch"
          >
            <div className="flex items-start gap-6 lg:w-full">
              <div className="flex-1">
                <HexFrame>
                  <Glyph />
                </HexFrame>
                <div className="mt-5">
                  <Label className="text-signal">
                    {index} — {title}
                  </Label>
                  <p className="type-body mt-3 max-w-[34ch] text-chalk-soft">
                    {body}
                  </p>
                </div>
              </div>

              {position < steps.length - 1 && (
                <span
                  aria-hidden
                  className="type-display shrink-0 self-center text-signal/45 lg:hidden"
                >
                  ›
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
