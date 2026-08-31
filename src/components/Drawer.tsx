"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/Label";
import { worldTotals } from "@/lib/market";

/*
 * The whole product in one list, behind a single control.
 *
 * Sections that do not exist yet are shown rather than hidden, marked with
 * their real state — "0 open" is information, and a menu that quietly omits
 * everything unbuilt tells a visitor nothing about where this is going.
 */
const groups = [
  {
    title: "The world",
    items: [
      { label: "World map", href: "#map", note: "0% claimed" },
      { label: "Cities by territory", href: "#ledger", note: `${worldTotals.totalCities}` },
      { label: "How it works", href: "#how", note: null },
    ],
  },
  {
    title: "Markets",
    items: [
      { label: "Open a market", href: "#map", note: "0 open" },
      { label: "Leaderboard", href: "#ledger", note: "Empty" },
      { label: "Your portfolio", href: "#map", note: "Connect" },
    ],
  },
  {
    title: "Reference",
    items: [
      { label: "Questions", href: "#faq", note: null },
      { label: "Token", href: "#faq", note: "$CITY" },
    ],
  },
] as const;

export function Drawer() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 flex-col items-center justify-center gap-[5px] border border-rule transition-colors duration-150 hover:border-signal"
      >
        {[0, 1, 2].map((bar) => (
          <span key={bar} aria-hidden className="h-px w-4 bg-chalk" />
        ))}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="flex-1 bg-void/80"
          />
          <nav className="w-[300px] max-w-[86vw] overflow-y-auto border-l border-rule bg-field">
            <div className="flex items-center justify-between border-b border-rule px-5 py-4">
              <Label className="text-chalk">City</Label>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="type-data px-2 text-chalk-muted transition-colors duration-150 hover:text-signal"
              >
                Close
              </button>
            </div>

            {groups.map((group) => (
              <div key={group.title} className="border-b border-rule px-5 py-4">
                <Label className="block text-chalk-muted">{group.title}</Label>
                <ul className="mt-3">
                  {group.items.map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-baseline justify-between gap-4 py-2 transition-colors duration-150 hover:text-signal"
                      >
                        <span className="type-body text-chalk">
                          {item.label}
                        </span>
                        {item.note && (
                          <span className="type-label shrink-0 text-chalk-muted">
                            {item.note}
                          </span>
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <p className="type-data px-5 py-4 text-chalk-muted">
              Nothing is deployed yet. Every counter here is a real zero, not
              a placeholder.
            </p>
          </nav>
        </div>
      )}
    </>
  );
}
