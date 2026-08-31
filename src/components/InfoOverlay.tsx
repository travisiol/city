"use client";

import { useState } from "react";
import { Faq } from "@/components/Faq";
import { HowItWorks } from "@/components/HowItWorks";
import { Ledger } from "@/components/Ledger";
import { Label } from "@/components/ui/Label";

/*
 * Everything that is not the globe, behind one control.
 *
 * The site is a single page, so the explanation cannot live below a fold
 * that does not exist. It opens over the world instead, in tabs, and closes
 * back to it — which keeps the globe as the only thing a visitor has to
 * understand on arrival.
 */
const tabs = [
  { id: "how", label: "How it works", Panel: HowItWorks },
  { id: "countries", label: "Countries", Panel: Ledger },
  { id: "questions", label: "Questions", Panel: Faq },
] as const;

type TabId = (typeof tabs)[number]["id"];

export function InfoOverlay({
  initialTab = "how",
  onClose,
}: {
  initialTab?: TabId;
  onClose: () => void;
}) {
  const [active, setActive] = useState<TabId>(initialTab);
  const Panel = tabs.find((tab) => tab.id === active)?.Panel ?? HowItWorks;

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-void/97 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 border-b border-rule px-4 sm:px-6">
        <ul className="flex items-center gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <li key={tab.id}>
              <button
                type="button"
                onClick={() => setActive(tab.id)}
                className={`type-label whitespace-nowrap border-b-2 px-3 py-4 transition-colors duration-150 ${
                  active === tab.id
                    ? "border-signal text-signal"
                    : "border-transparent text-chalk-soft hover:text-chalk"
                }`}
              >
                {tab.label}
              </button>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onClose}
          className="type-label shrink-0 border border-rule px-3 py-2 text-chalk-muted transition-colors duration-150 hover:border-signal hover:text-signal"
        >
          Back to the globe
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <Panel />
        <div className="px-4 py-8 sm:px-6">
          <Label className="text-chalk-muted">
            Nothing is deployed yet — every counter on this site is a real
            zero.
          </Label>
        </div>
      </div>
    </div>
  );
}
