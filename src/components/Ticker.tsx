"use client";

import { useWorld } from "@/lib/worldState";

/*
 * The genesis strip.
 *
 * At launch this carries the state of the world in plain sentences; once
 * cities start trading the same strip is where real events land. Right now
 * the emptiness is the message — every line is true, and an untouched map
 * is a better pitch than any invented volume figure.
 */
export function Ticker() {
  const { totals } = useWorld();

  const lines = [
    "Live preview — a map a few days old",
    `${totals.liveCities} cities opened, ${totals.totalCities - totals.liveCities} still untouched`,
    `${totals.owners} wallets in so far`,
    "Blue is a city; orange is a market",
    "Mint marks the city with the most owners",
    "Tokyo is 71 times the size of the 999th city",
    "511 of the 999 are in Asia; 872 are north of the equator",
    "Every city is its own token and its own market",
    "Trading fees are split between a city's holders",
  ];

  return (
    <div className="flex items-stretch border-t border-rule bg-void">
      <span className="flex shrink-0 items-center gap-2 border-r border-rule px-4 py-2.5">
        <span className="h-2 w-2 bg-signal" />
        <span className="type-label text-signal">Live preview</span>
      </span>

      <div className="relative flex-1 overflow-hidden">
        <div className="flex w-max animate-ticker">
          {/* Two copies so the loop has something to scroll into. */}
          {[0, 1].map((copy) => (
            <ul key={copy} className="flex shrink-0" aria-hidden={copy === 1}>
              {lines.map((line) => (
                <li
                  key={line}
                  className="flex items-center gap-4 whitespace-nowrap px-6 py-2.5"
                >
                  <span className="type-data text-chalk-soft">{line}</span>
                  <span aria-hidden className="text-signal/50">
                    ·
                  </span>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>

      <span className="hidden shrink-0 items-center border-l border-rule px-4 py-2.5 sm:flex">
        <span className="type-label text-chalk-muted">
          {totals.liveCities} / {totals.totalCities} taken
        </span>
      </span>
    </div>
  );
}
