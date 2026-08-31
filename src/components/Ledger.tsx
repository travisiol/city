import { Label } from "@/components/ui/Label";
import { cities, population } from "@/lib/cities";
import { worldTotals } from "@/lib/market";

/*
 * The one board that can be filled honestly at genesis.
 *
 * Market rankings need markets, and there are none yet — but where the
 * world's largest cities actually are is true today. China holding 193 of
 * the 999 and Asia holding 511 between them is the most interesting thing
 * this page can say before a single trade happens, and it is the fact the
 * globe is already showing: the lights are not spread evenly.
 */
const ROWS = 16;

const rows = (() => {
  const totals = new Map<string, { total: number; people: number }>();
  for (const city of cities) {
    const row = totals.get(city.country) ?? { total: 0, people: 0 };
    row.total += 1;
    row.people += city.pop;
    totals.set(city.country, row);
  }
  return [...totals.entries()]
    .map(([country, row]) => ({ country, ...row }))
    .sort((a, b) => b.total - a.total || a.country.localeCompare(b.country));
})();

const largest = rows[0]?.total ?? 1;
const shown = rows.slice(0, ROWS);
const restCountries = rows.length - shown.length;
const restCities = rows.slice(ROWS).reduce((sum, row) => sum + row.total, 0);

export function Ledger() {
  return (
    <section
      id="ledger"
      className="scroll-mt-16 border-b border-rule px-4 py-16 sm:px-6"
    >
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Label className="mb-3 block text-signal">The register</Label>
          <h2 className="type-display text-chalk">Cities by country</h2>
        </div>
        <p className="type-data max-w-[400px] text-chalk-muted">
          Where the {worldTotals.totalCities} largest cities on Earth
          actually are. Population decides the list — not land, not wealth,
          not anything else.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-rule-strong text-left">
              <th className="py-2 pr-4">
                <Label>Country</Label>
              </th>
              <th className="py-2 pr-4 text-right">
                <Label>Cities</Label>
              </th>
              <th className="py-2 pr-4 text-right">
                <Label>People</Label>
              </th>
              <th className="w-[34%] py-2">
                <Label>Against the largest</Label>
              </th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.country} className="border-b border-rule">
                <td className="type-data py-2.5 pr-4 text-chalk">
                  {row.country}
                </td>
                <td className="type-data py-2.5 pr-4 text-right text-chalk">
                  {row.total}
                </td>
                <td className="type-data py-2.5 pr-4 text-right text-chalk-muted">
                  {population(row.people)}
                </td>
                <td className="py-2.5">
                  {/* Scaled against the country with the most cities,
                      which is what the column says it measures. China takes
                      19% of the list on its own, so a share-of-world bar
                      would leave every other row a sliver. */}
                  <span className="flex h-2 w-full bg-rule/40" aria-hidden>
                    <span
                      className="h-full bg-chalk/60"
                      style={{ width: `${(row.total / largest) * 100}%` }}
                    />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 border-l-2 border-signal pl-4">
        <p className="type-data text-chalk-soft">
          And {restCountries} more countries holding {restCities} cities
          between them. No market has been opened anywhere yet — the
          rankings by price and volume appear here as soon as cities start
          trading.
        </p>
        <p className="type-data mt-2 max-w-[70ch] text-chalk-muted">
          Every city is a separate token with its own holders. Owning part of
          one gives you nothing in any of the others.
        </p>
      </div>
    </section>
  );
}
