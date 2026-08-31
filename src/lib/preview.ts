import { cities } from "@/lib/cities";
import type { CityMarket } from "@/lib/market";

/*
 * A worked example of a world a few days old.
 *
 * Nothing here is real and nothing here is ever shown unless a visitor asks
 * for it: it sits behind an explicit "preview a live world" control so the
 * site can demonstrate what an active city looks like without ever claiming
 * anybody has invested. The default state of the site remains the truth —
 * 999 cities open, none taken.
 *
 * Scale matters as much as honesty here. Three cities opened, a handful of
 * wallets in each, market caps in the low thousands: a fresh project that
 * showed sixty thousand owners would be advertising a lie about its size
 * even with the word "preview" over it.
 */

/** The three opened cities, ~120° apart so one is always on the near side. */
const OPENED = [
  { id: 303, owners: 7, marketCapUsd: 14_200, volume24hUsd: 1_342, change: 12.4 },
  { id: 614, owners: 5, marketCapUsd: 8_600, volume24hUsd: 610, change: -6.8 },
  { id: 845, owners: 4, marketCapUsd: 5_400, volume24hUsd: 388, change: 3.1 },
] as const;

/** Fixed supply per city, so price falls out of the cap rather than the reverse. */
const SUPPLY = 1_000_000;

/** Owner count at which a city is drawn green rather than signal. */
export const CROWDED_OWNERS = 6;

function hash(seed: number): () => number {
  let state = (seed * 2654435761) >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface PreviewHolder {
  handle: string;
  address: string;
  share: number;
  joinedDaysAgo: number;
}

export interface PreviewMarket extends CityMarket {
  holders: PreviewHolder[];
}

const NAMES = [
  "cobaltsentry",
  "hollowbaron",
  "ashwolf",
  "vaultkeeper",
  "emberlark",
  "quietharbor",
  "northfell",
  "slatecrown",
] as const;

/**
 * With only a handful of wallets in a city they hold all of it between
 * them, so the shares are drawn to sum to exactly 100 and every owner is
 * listed. No "and 240 others" tail to hide behind.
 */
function makeHolders(rand: () => number, owners: number): PreviewHolder[] {
  const weights = Array.from({ length: owners }, () => 0.35 + rand());
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  const shares = weights.map((weight) => (weight / total) * 100);

  const holders = shares.map((share) => {
    const hex = Math.floor(rand() * 0xffffff)
      .toString(16)
      .padStart(6, "0");
    const tail = Math.floor(rand() * 0xffff)
      .toString(16)
      .padStart(4, "0");
    return {
      handle: `${NAMES[Math.floor(rand() * NAMES.length)]}-${Math.floor(rand() * 90) + 10}`,
      address: `0x${hex}…${tail}`,
      share: Math.round(share * 100) / 100,
      joinedDaysAgo: Math.floor(rand() * 5) + 1,
    };
  });

  return holders.sort((a, b) => b.share - a.share);
}

function unopened(id: number): PreviewMarket {
  return {
    id,
    isLive: false,
    activity: 0,
    priceUsd: 0,
    change24h: 0,
    marketCapUsd: 0,
    volume24hUsd: 0,
    owners: 0,
    rewardsUsd: 0,
    topHolders: [],
    holders: [],
  };
}

const byId = new Map<number, PreviewMarket>();
const peak = Math.max(...OPENED.map((city) => city.volume24hUsd));

for (const city of OPENED) {
  const rand = hash(city.id);
  const holders = makeHolders(rand, city.owners);
  byId.set(city.id, {
    id: city.id,
    isLive: true,
    activity: city.volume24hUsd / peak,
    priceUsd: city.marketCapUsd / SUPPLY,
    change24h: city.change,
    marketCapUsd: city.marketCapUsd,
    volume24hUsd: city.volume24hUsd,
    owners: city.owners,
    // Fees the city has thrown off since it opened: a 1% trading fee over a
    // few days of the volume above, not a headline number.
    rewardsUsd: Math.round(city.volume24hUsd * 0.01 * (2 + rand() * 2)),
    topHolders: holders.slice(0, 3).map((holder) => holder.share),
    holders,
  });
}

export function previewMarketFor(id: number): PreviewMarket {
  return byId.get(id) ?? unopened(id);
}

const live = [...byId.values()];

export const previewPeakActivity = 1;

export const previewTotals = {
  totalCities: cities.length,
  liveCities: live.length,
  owners: live.reduce((sum, market) => sum + market.owners, 0),
  volume24hUsd: live.reduce((sum, market) => sum + market.volume24hUsd, 0),
  rewardsUsd: live.reduce((sum, market) => sum + market.rewardsUsd, 0),
  claimedPct: (live.length / cities.length) * 100,
};
