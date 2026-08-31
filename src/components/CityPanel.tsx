"use client";

import { useState } from "react";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/Button";
import { WalletConnect } from "@/components/WalletConnect";
import { Label } from "@/components/ui/Label";
import { coordinates, type City } from "@/lib/cities";
import {
  percent,
  signedPercent,
  tokenPrice,
  usdExact,
} from "@/lib/market";
import { CROWDED_OWNERS } from "@/lib/preview";
import { canClaim } from "@/lib/site-config";
import { useWorld } from "@/lib/worldState";

/*
 * The city sheet, slid in over the globe.
 *
 * Two states, and which one shows is a fact rather than a choice: a city
 * with a market gets its figures and its holder list, a city without gets
 * an explanation of what opening it would mean. At genesis every city is
 * the second kind.
 */

/** How a city's supply divides once it trades. A diagram, not a reading. */
function SplitDiagram() {
  const bands = [
    { label: "First buyer", width: "26%", tone: "bg-signal" },
    { label: "Next holders", width: "31%", tone: "bg-holder-near" },
    { label: "Everyone after", width: "43%", tone: "bg-holder-far" },
  ];
  return (
    <div>
      <div className="flex h-2.5 w-full overflow-hidden">
        {bands.map((band) => (
          <span key={band.label} className={band.tone} style={{ width: band.width }} />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
        {bands.map((band) => (
          <li key={band.label} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${band.tone}`} />
            <span className="type-data text-chalk-soft">{band.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <Label className="block">{label}</Label>
      <p className={`type-figure-sm mt-1.5 ${tone ?? "text-chalk"}`}>{value}</p>
    </div>
  );
}

export function CityPanel({
  city,
  onClose,
}: {
  city: City;
  onClose: () => void;
}) {
  const { isConnected } = useConnection();
  const { marketFor } = useWorld();
  const [tab, setTab] = useState<"holders" | "about">("holders");

  const market = marketFor(city.id);
  const crowded = market.owners >= CROWDED_OWNERS;

  return (
    <div className="flex h-full flex-col overflow-y-auto border-l border-rule bg-void/97 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4 border-b border-rule px-5 py-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="type-display text-chalk">{city.name}</span>
            <span className="type-label border border-cold/40 px-2 py-1 text-cold">
              #{String(city.id).padStart(3, "0")}
            </span>
            {market.isLive ? (
              <span
                className={`type-label border px-2 py-1 ${
                  crowded
                    ? "border-gain text-gain"
                    : "border-signal text-signal"
                }`}
              >
                {crowded ? "Most owners" : "Open market"}
              </span>
            ) : (
              <span className="type-label border border-rule px-2 py-1 text-chalk-muted">
                Unopened
              </span>
            )}
          </div>
          <p className="type-data mt-2 text-chalk-soft">
            {city.admin1 ? `${city.admin1}, ` : ""}
            {city.country}
          </p>
          <p className="type-data text-chalk-muted">
            {coordinates(city.lat, city.lon)}
            {city.continent ? ` · ${city.continent}` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close city"
          className="type-data shrink-0 border border-rule px-2.5 py-1 text-chalk-muted transition-colors duration-150 hover:border-signal hover:text-signal"
        >
          ✕
        </button>
      </div>

      {/*
        The only figures on this panel that are true before a single trade:
        how many people live here. Metro against city proper, because the
        gap between them is often the more interesting number — it is the
        difference between a city and everything that commutes into it.
      */}
      <div className="grid grid-cols-2 gap-4 border-b border-rule bg-field-raised px-5 py-4">
        <div>
          <Label className="block text-cold">Metro</Label>
          <p className="type-figure-sm mt-1.5 text-chalk">
            {city.pop.toLocaleString("en-US")}
          </p>
        </div>
        <div>
          <Label className="block text-cold">City proper</Label>
          <p className="type-figure-sm mt-1.5 text-chalk-soft">
            {city.popCity > 0 ? city.popCity.toLocaleString("en-US") : "—"}
          </p>
        </div>
      </div>

      {market.isLive ? (
        <>
          <div className="grid grid-cols-4 gap-4 border-b border-rule px-5 py-5">
            <Stat label="Owners" value={String(market.owners)} />
            <Stat label="Your share" value="—" tone="text-chalk-muted" />
            <Stat label="24h volume" value={usdExact(market.volume24hUsd)} />
            <Stat
              label="24h"
              value={signedPercent(market.change24h)}
              tone={market.change24h >= 0 ? "text-gain" : "text-loss"}
            />
          </div>

          <div className="grid grid-cols-3 gap-4 border-b border-rule px-5 py-5">
            <Stat label="Token price" value={tokenPrice(market.priceUsd)} />
            <Stat label="Market cap" value={usdExact(market.marketCapUsd)} />
            <Stat
              label="Fees generated"
              value={usdExact(market.rewardsUsd)}
              tone="text-gain"
            />
          </div>

          <div className="border-b border-rule px-5 py-5">
            <div className="border-l-2 border-signal bg-field px-4 py-3">
              <Label className="block text-signal">You hold none of this city</Label>
              <p className="type-body mt-1.5 text-chalk-soft">
                {market.owners} wallets hold it between them. Buying in gives
                you a share alongside them, not the city itself.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {!isConnected ? (
                <WalletConnect
                  wrapperClassName="col-span-2 w-full"
                  className="w-full justify-center px-4 py-3 text-center"
                />
              ) : (
                <>
                  <Button disabled={!canClaim}>Buy city</Button>
                  <Button variant="outline" disabled={!canClaim}>
                    Sell
                  </Button>
                </>
              )}
            </div>
          </div>

          <div className="border-b border-rule px-5">
            <div className="flex gap-1">
              {(
                [
                  ["holders", "Holders"],
                  ["about", "How it splits"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`type-label border-b-2 px-3 py-3 transition-colors duration-150 ${
                    tab === id
                      ? "border-signal text-signal"
                      : "border-transparent text-chalk-soft hover:text-chalk"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {tab === "holders" ? (
            <div className="px-5 py-4">
              <Label className="block text-chalk-muted">
                Largest holders · {market.owners} in total
              </Label>
              <ul className="mt-3">
                {market.holders.map((holder) => (
                  <li
                    key={holder.address}
                    className="flex items-baseline justify-between gap-3 border-b border-rule py-2.5 last:border-b-0"
                  >
                    <span className="min-w-0">
                      <span className="type-data block truncate text-chalk">
                        {holder.handle}
                      </span>
                      <span className="type-label block text-chalk-muted">
                        {holder.address}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="type-data block text-signal">
                        {percent(holder.share)}
                      </span>
                      <span className="type-label block text-chalk-muted">
                        {holder.joinedDaysAgo}d ago
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              {market.owners > market.holders.length && (
                <p className="type-data mt-3 text-chalk-muted">
                  And {market.owners - market.holders.length} more wallets
                  holding the rest between them.
                </p>
              )}
            </div>
          ) : (
            <div className="px-5 py-5">
              <SplitDiagram />
              <p className="type-body mt-4 text-chalk-soft">
                Your share is the percentage of this city&rsquo;s tokens you
                hold. Fees from every trade on it are split the same way.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="px-5 py-5">
          <div className="grid grid-cols-2 gap-4 border-b border-rule pb-5">
            <Stat label="Owners" value="0" tone="text-chalk-muted" />
            <Stat label="Token price" value="—" tone="text-chalk-muted" />
            <Stat label="24h volume" value="—" tone="text-chalk-muted" />
            <Stat label="Fees generated" value="—" tone="text-chalk-muted" />
          </div>

          <Label className="mt-5 block text-signal">No market open yet</Label>
          <p className="type-body mt-3 text-chalk-soft">
            Nobody has opened this city. Whoever does sets its starting supply
            and becomes its first holder — but not its only one. From that
            moment anyone can buy in alongside them, and the city starts
            generating fees like any other.
          </p>

          <div className="mt-5 border border-rule bg-field px-4 py-4">
            <Label className="block text-chalk-muted">
              How this city would split
            </Label>
            <div className="mt-4">
              <SplitDiagram />
            </div>
          </div>

          {!isConnected ? (
            <WalletConnect
              wrapperClassName="mt-5 w-full"
              className="w-full justify-center px-4 py-3 text-center"
            />
          ) : (
            <Button className="mt-5 w-full" disabled={!canClaim}>
              Open this market
            </Button>
          )}

          <p className="type-data mt-3 text-chalk-soft">
            {canClaim
              ? "Set the starting supply and become this city's first holder."
              : "Opening markets starts a few minutes after launch. Connect now so you are ready."}
          </p>
        </div>
      )}
    </div>
  );
}
