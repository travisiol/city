import { Label } from "@/components/ui/Label";
import { claimConfig, world } from "@/lib/site-config";

/*
 * Written against the one misreading that matters: that buying a city
 * means buying the whole thing. The first three answers all attack it from
 * different directions, because it is the misunderstanding that would cost
 * somebody money.
 */
const entries = [
  {
    q: "Am I buying the whole city?",
    a: "No. Every city is a token, and you buy however much of that token you want. Hold 10% of a city's supply and you hold roughly 10% of its economic ownership — hundreds of wallets can hold the same city at once.",
  },
  {
    q: "So what does ownership actually mean?",
    a: "Your share of a city is the percentage of its tokens you hold, and that same percentage decides your cut of the fees the city's trading generates. Buy more of it and both go up; sell some and both go down.",
  },
  {
    q: "Where do the fees come from?",
    a: "From trading on that specific city. Every buy and sell of a city's token generates fees, and those fees are distributed across that city's holders in proportion to what each one holds. A city nobody trades generates nothing.",
  },
  {
    q: "Are all cities one big market?",
    a: `No — there are ${world.totalCities} of them and each is independent. Its own token, its own price, its own holders, its own fees. Owning part of one gives you nothing in any of the others.`,
  },
  {
    q: "Why are some cities orange and some blue?",
    a: "There are two lights. Blue-white is a city with people in it and no market — the colour of the LED street lighting that is replacing sodium everywhere. Orange is a market, and the brighter it burns the more is being traded on it. Right now the whole globe is blue, because no market has been opened anywhere. Dot size is population, always, in both colours."
  },
  {
    q: "Are all cities the same size?",
    a: "Not remotely, and that is the point. Tokyo has 35.7 million people in its metro area and the 999th city has 500,000 — a factor of 71. Every dot on the globe is drawn so its area matches its population, so what you are looking at is the real distribution and not a flattering one.",
  },
  {
    q: "Why does China have so many?",
    a: "Because that is where people live. China holds 193 of the 999, the United States 92 and India 91, and Asia alone holds 511 — more than half. The list follows population and nothing else: no land area, no economy, no weighting, no quota per country. 872 of the 999 are north of the equator for the same reason."
  },
  {
    q: "What does it cost to buy in?",
    a:
      claimConfig.priceEth !== null
        ? `Whatever the city's token is trading at, plus gas. There is no fixed entry — you decide how much of a city to buy.`
        : `There is no fixed entry price. You buy as much or as little of a city's token as you want, at whatever it is trading at, plus gas.`,
  },
  {
    q: "When does trading open?",
    a: "A few minutes after launch. Everything on this page is already wired to the contracts and turns on by itself — connect your wallet now and you are ready.",
  },
  {
    q: "Which chain is this on?",
    a: "Robinhood Chain. Connect any injected wallet and the site will prompt you to switch if you are somewhere else. Gas is paid in ETH.",
  },
  {
    q: "Where does the data come from?",
    a: "Natural Earth, public domain. A script in this repo ranks its populated places by metro population and keeps the top 999, with the coastlines drawn from the same source. Nothing is fetched at runtime. Where two cities claim the same metro figure the larger city proper wins, which matters because the 999th place is decided inside a tie at exactly 500,000.",
  },
] as const;

export function Faq() {
  return (
    <section id="faq" className="scroll-mt-14 border-b border-rule px-4 py-16 sm:px-6">
      <Label className="mb-3 block text-signal">Questions</Label>
      <h2 className="type-display mb-12 text-chalk">Before you buy</h2>

      <dl className="grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
        {entries.map((entry) => (
          <div key={entry.q} className="border-t border-rule pt-4">
            <dt className="type-title text-chalk">{entry.q}</dt>
            <dd className="type-body mt-3 max-w-[54ch] text-chalk-soft">
              {entry.a}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
