"use client";

import { useEffect, useState } from "react";
import { Globe } from "@/components/Globe";
import { InfoOverlay } from "@/components/InfoOverlay";
import { CityPanel } from "@/components/CityPanel";
import { Ticker } from "@/components/Ticker";
import { WalletConnect } from "@/components/WalletConnect";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { LARGEST_POP, cities, population, type City } from "@/lib/cities";
import { useWorld } from "@/lib/worldState";

/*
 * One page: the globe, and whatever is being looked at on it.
 *
 * There is nothing to scroll to. The pitch sits over the world until a city
 * is picked, at which point it steps aside for that city's sheet, and the
 * explanation opens over the top when asked for. A visitor only ever has
 * one thing in front of them.
 */
export function World() {
  const [selected, setSelected] = useState<City | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [wide, setWide] = useState(true);
  const { totals, marketFor } = useWorld();

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const sync = () => setWide(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  /*
   * The sphere moves out from under whatever is open. Side by side with the
   * copy on a wide screen, shifted left again when a city sheet takes the
   * right edge, and lifted into the top half on a narrow one so the copy
   * has the bottom to itself. Nothing is ever read on top of the globe.
   */
  /*
   * With three cities opened out of 999, hunting for one by spinning the
   * globe is not a game anyone wins. When any city has a market, this
   * button goes to one of those; otherwise it opens any city, which is
   * still the fastest way to show that the globe is clickable.
   */
  const openACity = () => {
    const opened = cities.filter((city) => marketFor(city.id).isLive);
    const pool = opened.length > 0 ? opened : cities;
    setSelected(pool[Math.floor(Math.random() * pool.length)]);
  };

  const bias = wide ? (selected ? 0.34 : 0.66) : 0.5;
  const biasY = wide ? 0.5 : 0.32;

  const pills = [
    { key: "Chain", value: "Robinhood Chain" },
    { key: "Largest", value: `${cities[0].name} · ${population(LARGEST_POP)}` },
    {
      key: "Cities taken",
      value: `${totals.liveCities} / ${totals.totalCities}`,
    },
    { key: "Owners", value: totals.owners.toLocaleString("en-US") },
  ];

  return (
    /*
     * Absolutely positioned rather than h-full: main is a flex-1 item, so
     * its computed height stays `auto` and a percentage height resolves to
     * zero against it. Filling the positioned ancestor sidesteps that.
     */
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <Globe
          selectedId={selected?.id ?? null}
          onSelect={setSelected}
          bias={bias}
          biasY={biasY}
          className="h-full w-full"
        />
      </div>

      {/* The pitch, until a city takes its place. */}
      {!selected && (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 px-4 sm:px-8 lg:inset-y-0 lg:right-auto lg:flex lg:w-[46%] lg:items-center">
          <div className="pitch pointer-events-auto w-full max-w-[520px]">
            <Label className="text-signal">Live preview · Robinhood Chain</Label>

            <h1 className="type-hero wordmark-blade mt-4 text-chalk">
              City
            </h1>
            <p className="type-display mt-4 text-signal">Buy into a city</p>
            <p className="type-display text-chalk">before it lights up</p>

            <p className="type-body mt-5 max-w-[46ch] text-chalk-soft">
              The 999 largest cities on Earth, ranked by the people who live
              in them. Every one has its own token and its own market, so a
              city can be held by hundreds of people at once — you included.
              Tokyo is 71 times the size of the 999th, and nothing about that
              is hidden here.
            </p>

            <dl className="mt-6 flex flex-wrap gap-2">
              {pills.map((pill) => (
                <div
                  key={pill.key}
                  className="flex items-baseline gap-2 border border-rule bg-void/70 px-3 py-2"
                >
                  <dt>
                    <Label className="text-chalk-muted">{pill.key}</Label>
                  </dt>
                  <dd className="type-data text-chalk">{pill.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={openACity}>Open a city</Button>
              <WalletConnect className="border border-rule-strong px-4 py-3 text-chalk hover:border-signal hover:text-signal" />
              <Button variant="outline" onClick={() => setInfoOpen(true)}>
                How it works
              </Button>
              {/*
                Opt-in, and it says on the tin what it is. The site's default
                is the truth — nothing has been claimed — and this exists so
                a visitor can see what an active city looks like without the
                page ever implying anyone has invested.
              */}
            </div>
          </div>
        </div>
      )}

      {/* Once a city is picked, the pitch collapses to one line. */}
      {selected && (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 hidden px-4 sm:block sm:px-8">
          <div className="pointer-events-auto flex flex-wrap items-center gap-3">
            <Label className="text-chalk-muted">
              Live preview · {totals.liveCities} / {totals.totalCities} cities
              taken
            </Label>
            <Button variant="outline" onClick={() => setInfoOpen(true)}>
              How it works
            </Button>
          </div>
        </div>
      )}

      {/* The city sheet, over the world rather than beside it. */}
      {selected && (
        <div className="absolute inset-y-0 right-0 z-30 w-full max-w-[440px]">
          <CityPanel city={selected} onClose={() => setSelected(null)} />
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 z-20">
        <Ticker />
      </div>

      {infoOpen && <InfoOverlay onClose={() => setInfoOpen(false)} />}
    </div>
  );
}
