"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { marketFor as genesisMarketFor, peakActivity, worldTotals } from "@/lib/market";
import type { CityMarket } from "@/lib/market";
import {
  previewMarketFor,
  previewPeakActivity,
  previewTotals,
  type PreviewHolder,
} from "@/lib/preview";

/*
 * One switch between the world as it is and the world as an example.
 *
 * The site's default and its truth is genesis: 999 cities, none taken. The
 * preview is opt-in, announced wherever it is on, and exists so a visitor
 * can see what an active city looks like without the site ever asserting
 * that anybody has invested.
 *
 * This is also the seam the contracts plug into later: swap the genesis
 * branch for chain reads and nothing above it changes.
 */

export interface WorldMarket extends CityMarket {
  holders: PreviewHolder[];
}

interface WorldState {
  isPreview: boolean;
  setPreview: (on: boolean) => void;
  marketFor: (id: number) => WorldMarket;
  peakActivity: number;
  totals: typeof worldTotals;
}

const WorldContext = createContext<WorldState | null>(null);

export function WorldStateProvider({ children }: { children: ReactNode }) {
  /*
   * The live preview is the view. There is no second mode to switch to and
   * nothing to exit into — the world it shows is labelled a preview
   * wherever it appears, which is what keeps its figures from reading as a
   * claim about what has already happened.
   */
  const [isPreview, setPreview] = useState(true);

  const marketFor = useCallback(
    (id: number): WorldMarket =>
      isPreview
        ? previewMarketFor(id)
        : { ...genesisMarketFor(id), holders: [] },
    [isPreview],
  );

  const value = useMemo<WorldState>(
    () => ({
      isPreview,
      setPreview,
      marketFor,
      peakActivity: isPreview ? previewPeakActivity : peakActivity,
      totals: isPreview ? previewTotals : worldTotals,
    }),
    [isPreview, marketFor],
  );

  return (
    <WorldContext.Provider value={value}>{children}</WorldContext.Provider>
  );
}

export function useWorld(): WorldState {
  const value = useContext(WorldContext);
  if (!value) throw new Error("useWorld must be used inside WorldStateProvider");
  return value;
}
