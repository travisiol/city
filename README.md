# CITY

The world's 999 largest cities, ranked by the people who live in them. Buy
into one on the globe.

Third in a family. PLOTLAND cuts Earth into 999 parcels of identical area and
DUSTLAND does the same to the Moon; both rest on the argument that the parcels
are equal, so nothing but desire can set a price. **This one inverts that.**
Tokyo has 35.7 million people and the 999th city has 500,000 — a factor of 71 —
and every dot on the globe is drawn so its area matches its population. The
distribution is the product.

`CITY` is one string in `src/lib/site-config.ts` plus the `NEXT_PUBLIC_CITY_*`
env prefix, so renaming is a two-line change.

## Stack

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · wagmi v3 + viem ·
TypeScript. Injected wallets only, Robinhood Chain, no backend.

## The globe is the product

`src/components/Globe.tsx` draws a night Earth and 999 cities on a canvas.
There is no grid here and no projection — the two sister projects needed an
equal-area lattice and a binary search to land on 999 cells; this one needs a
sort.

Nothing of the ground is filled. After dark the land is as black as the sea, so
there is no landmass to paint — which is fortunate, because filling a polygon on
a rotating sphere tears at the limb. The continents are legible because the
cities are standing on them. Where the dots crowd you are looking at the Nile,
the Ganges, the eastern seaboard; where they stop you are looking at the Sahara.

Data is generated once and committed — nothing is fetched at build or run time:

```bash
python scripts/build-cities.py
```

That writes `src/data/cities.json` and `src/data/coastline.json`.

**The id is the rank.** City #1 is Tokyo because Tokyo is the largest. That
makes the id mean something on its own, which it never could on a grid numbered
north to south.

**How the cut is decided.** Ranked by metro population (`POP_MAX`), top 999.
The cut lands inside a tie: 994 cities are strictly above 500,000 and thirteen
sit exactly on it for the last five places. `POP_MIN` breaks it — when two
cities claim the same metro figure, the one with the larger city proper is the
larger city — and name is the final tiebreak so a rebuild cannot reshuffle the
tail.

The counts that fall out are facts about where people live, not editorial
choices:

| | |
| --- | --- |
| China | 193 cities |
| United States | 92 |
| India | 91 |
| Asia | 511 — more than half |
| North of the equator | 872 of 999 |
| Largest : smallest | 71.4× |

## Finding your own city

A sphere with 999 dots on it is a lovely thing to look at and a hopeless thing
to search, and almost everyone arriving wants exactly one city. `CitySearch`
is the shortcut: type, arrow, enter — or `/` from anywhere on the page.

Matching folds diacritics both ways, so "sao paulo" finds São Paulo and "malmo"
finds Malmö. Results are tiered — name-prefix, name-substring, country-prefix,
country-substring — and within a tier the larger city wins, which falls out of
`id` already being the rank. Typing a country name therefore lists that
country's cities largest first, which is a useful thing to be able to do by
accident.

**Picking a result flies the globe to it.** Selecting a city on the far side
would show the user nothing at all, so `Globe` takes a `focus` prop and swings
the sphere around. Bringing a point to face the viewer is exact rather than
iterative: the projection yaws first and pitches second, so a city at
(lon, lat) lands dead centre at `yaw = -lon` and `pitch = lat`. The target yaw
is shifted by whole turns to the revolution nearest where the globe already is,
or a city a few degrees east sends it the long way round the planet. A hand on
the globe cancels the flight.

`focus` carries a nonce as well as an id, because searching the same city twice
should fly there twice and an id alone cannot say it was asked for again. It is
deliberately separate from `selectedId`: clicking a dot you can already see
should not yank the sphere out from under the cursor.

**Two lights.** Blue-white (`#7fb4e8`) is a city with people and no market — the
colour of the LED street lighting genuinely replacing sodium everywhere.
Sodium orange (`#ff7a18`) is a market. Nothing else on the page may use the warm
one. On a sphere of 999 points of light, warmth has to mean activity or it means
nothing.

**Dot area, not dot width.** `cityWeights` holds the square root of each
population share, because a disc's area grows with the square of its radius.
Scaling radius by population directly would draw Tokyo five thousand times the
smallest city instead of seventy-one times.

## The contract this page expects

The ABI in `src/lib/cityAbi.ts` is specced around the map rather than the other
way round:

| Function | Why |
| --- | --- |
| `claim(uint256 cityId) payable` | Claiming is by id, so you take the city you picked rather than whatever the next mint hands you. |
| `claimedBitmap() view returns (uint256[4])` | The map needs all 999 states every time it draws. 999 bits pack into four words, so that is one view call instead of 999 `ownerOf` lookups or an indexer. Bit *n* of word *n >> 8* is city *n + 1*. |
| `totalSupply() view returns (uint256)` | Claim count. |

If the deployed contract names these differently, that one file is the only
thing to change.

## Pre-launch state

The site ships before the contract does, so it runs entirely on env vars.
Everything flips automatically once `NEXT_PUBLIC_CITY_CONTRACT_ADDRESS`,
`NEXT_PUBLIC_CITY_PRICE_ETH` and `NEXT_PUBLIC_CITY_LIVE=true` exist. No code
change.

No yield rate, floor, valuation or launch date appears anywhere. None of it is
decided, and inventing a figure here is the one thing on this page a holder
could actually be hurt by. The only numbers true at genesis are the population
figures, and they are labelled as what they are.

## Setup

```bash
npm install
cp .env.example .env.local   # optional — it runs with no env at all
npm run dev
```

## Going live

1. Deploy a contract exposing the three functions above.
2. Set `NEXT_PUBLIC_CITY_CONTRACT_ADDRESS`, `NEXT_PUBLIC_CITY_PRICE_ETH` and
   `NEXT_PUBLIC_CITY_LIVE=true`.
3. Set `NEXT_PUBLIC_MAINNET_RPC_URL` to a private endpoint — the public RPC
   will rate-limit under real traffic, and the map polls the bitmap every 20
   seconds.
4. Set `NEXT_PUBLIC_SITE_URL` so metadata, `sitemap.xml` and `robots.txt` point
   at the real domain.

Social links stay hidden until their env vars are set, so no dead link ships.

Robinhood Chain network details in `src/lib/chain.ts` (chain id, RPC, explorer)
are unverified third-party research and must be re-confirmed against
`docs.robinhood.com/chain` before mainnet use.

## Art direction

One photograph: Earth from orbit, after dark. Land and sea the same blue-black,
and the only thing visible is where people are. That is the argument the two
sister projects had to make in words; this one shows it.

The display face is condensed, because that is the language cities already
speak — transit signage, street blades, departure boards. Not the heavy poster
of a land grab and not the mono stencil of an instrument. The wordmark is hung
under a sodium rule like a street blade.

## Attribution

Cities and coastlines from [Natural Earth](https://www.naturalearthdata.com/),
public domain. `scripts/ne_10m_populated_places.trimmed.geojson` is that
project's populated-places file reduced to the twelve fields used and the top
1500 cities, so the repo does not carry a 19 MB blob; the header of
`scripts/build-cities.py` has the command to refetch the original.

## Known limits

- **Metro population is a soft number.** `POP_MAX` is Natural Earth's
  best-effort metro figure and its vintage varies by city. It is right for
  ranking and it should not be read as a census.
- **Fourteen names appear twice** in the 999 — Hyderabad, Santiago, Barcelona,
  Valencia and others are genuinely different cities in different countries.
  Nothing keys on name alone; the id is the key and the country is always shown
  beside the name.

## Verification

`npx tsc --noEmit`, `npx eslint` and `npx next build` all pass clean.
