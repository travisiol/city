"use client";

import Link from "next/link";
import { Drawer } from "@/components/Drawer";
import { WalletConnect } from "@/components/WalletConnect";
import { Label } from "@/components/ui/Label";
import { siteConfig } from "@/lib/site-config";
import { useWorld } from "@/lib/worldState";

/*
 * The state of the world, carried in the header.
 *
 * Every chip is a real reading. They all sit at zero right now, and that is
 * the point — an honest empty board says "nothing has been taken yet" far
 * better than an invented one says anything at all.
 */
/**
 * The mark: what the globe itself draws. One city lit and trading, two
 * still cold, at the sizes the map would give them. No frame around it —
 * there is no grid cell to draw here, only the light.
 */
function Mark() {
  return (
    <svg width="30" height="34" viewBox="0 0 30 34" aria-hidden focusable="false">
      <circle cx="11" cy="18" r="10" fill="none" stroke="#ff7a18" strokeOpacity="0.3" />
      <circle cx="11" cy="18" r="6" fill="#ff7a18" />
      <circle cx="24" cy="9" r="3.2" fill="#7fb4e8" />
      <circle cx="23" cy="27" r="2" fill="#7fb4e8" fillOpacity="0.8" />
    </svg>
  );
}

export function Navbar() {
  const { totals } = useWorld();

  const chips = [
    { key: "Cities", value: String(totals.totalCities) },
    {
      key: "Claimed",
      // 3 of 999 is 0.3%, not 0% — round to whole numbers only once there
      // is a whole number to show.
      value: `${totals.claimedPct > 0 && totals.claimedPct < 1 ? totals.claimedPct.toFixed(1) : totals.claimedPct.toFixed(0)}%`,
    },
    { key: "Owners", value: totals.owners.toLocaleString("en-US") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-rule bg-void/92 backdrop-blur-sm">
      <nav className="flex h-16 items-center gap-4 px-4 sm:px-6">
        <Drawer />

        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Mark />
          <span className="hidden sm:block">
            <span className="type-title block leading-none text-chalk">
              {siteConfig.name}
            </span>
            <span className="type-label mt-1 block text-signal">
              999 cities. None equal.
            </span>
          </span>
        </Link>

        <ul className="hidden items-center gap-5 lg:flex">
          {chips.map((chip) => (
            <li key={chip.key} className="flex items-baseline gap-2">
              <Label className="text-chalk-muted">{chip.key}</Label>
              <span className="type-data text-chalk">{chip.value}</span>
            </li>
          ))}
          <li className="flex items-baseline gap-2">
            <Label className="text-chalk-muted">Token</Label>
            <span className="type-data text-signal">$CITY</span>
          </li>
        </ul>

        <div className="ml-auto flex items-center gap-3">
          <a
            href="#how"
            className="type-label hidden text-chalk-soft transition-colors duration-150 hover:text-signal md:inline"
          >
            How it works
          </a>
          <WalletConnect />
        </div>
      </nav>
    </header>
  );
}
