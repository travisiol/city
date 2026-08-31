"""
Builds the 999-city index that the whole site is drawn from.

Run:  python scripts/build-cities.py

Writes two generated files into src/data/. Those outputs are committed, so
the app never fetches geodata at build or run time — this script only needs
to run again if the city count changes.

What this is NOT: a grid. The two projects this one is forked from cut a
sphere into 999 cells of identical area, and the whole argument there was
that the parcels are equal, so nothing but desire can set a price. Here the
opposite is true and it is the point. Tokyo is 71 times the 999th city.
No two of these are the same size, the same age or the same anything, and a
ranking is the honest shape for that — so there is no projection in this
file, no lattice and no binary search. Just a sort.

**The id is the rank.** City #1 is Tokyo because Tokyo is the largest, and
city #999 is the smallest that made the cut. That makes the id mean
something on its own, which it never could on a grid numbered north to
south.

Data is Natural Earth (public domain), trimmed to the fields used and the
top 1500 cities so the repo does not carry a 19 MB blob. To refresh it:

    curl -sSL -o ne_10m_populated_places.geojson \\
      https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_populated_places.geojson

then keep only the KEEP fields below and the top 1500 by POP_MAX.
"""

import io
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_DIR = os.path.join(ROOT, "src", "data")

TARGET_CITIES = 999

# Natural Earth's 110m country file has no polygon for a city-state or a
# small island nation, so five of the 999 find no continent by code. They
# are not ambiguous and they are not worth a second data file.
CONTINENT_OVERRIDES = {
    "BHR": "Asia",
    "HKG": "Asia",
    "MAC": "Asia",
    "MUS": "Africa",
    "SGP": "Asia",
}


def load_continents():
    """Continent by ISO A3, read off the country outlines."""
    path = os.path.join(HERE, "ne_110m_admin_0_countries.geojson")
    data = json.load(io.open(path, encoding="utf-8"))
    by_code = {}
    for feature in data["features"]:
        props = feature["properties"]
        code = props.get("ADM0_A3")
        if code:
            by_code[code] = props.get("CONTINENT") or ""
    by_code.update(CONTINENT_OVERRIDES)
    return by_code


def rings_of(geometry):
    """Yields every linear ring of a Polygon or MultiPolygon."""
    kind = geometry["type"]
    if kind == "Polygon":
        for ring in geometry["coordinates"]:
            yield ring
    elif kind == "MultiPolygon":
        for polygon in geometry["coordinates"]:
            for ring in polygon:
                yield ring


def load_coastline():
    """
    Coastlines as lon/lat rings.

    The globe draws these and nothing else of the ground. At night the land
    is as dark as the sea, so there is no landmass to fill — which is lucky,
    because filling a polygon on a rotating sphere tears at the limb. The
    outline is there so a continent is readable when its coast happens to be
    unlit; the cities do the rest of the drawing.
    """
    path = os.path.join(HERE, "ne_110m_land.geojson")
    data = json.load(io.open(path, encoding="utf-8"))
    rings = []
    for feature in data["features"]:
        for ring in rings_of(feature["geometry"]):
            if len(ring) > 3:
                rings.append([(lon, lat) for lon, lat in ring])
    return rings


def main():
    continents = load_continents()

    path = os.path.join(HERE, "ne_10m_populated_places.trimmed.geojson")
    source = json.load(io.open(path, encoding="utf-8"))
    rows = [f["properties"] for f in source["features"]]

    # Ranked by metro population. The cut lands inside a tie — 994 cities
    # are strictly above 500,000 and thirteen sit exactly on it for the last
    # five places — so POP_MIN breaks it: when two cities claim the same
    # metro figure, the one with the larger city proper is the larger city.
    # Name is the final tiebreak so a rebuild cannot reshuffle the tail.
    rows.sort(
        key=lambda r: (
            -(r.get("POP_MAX") or 0),
            -(r.get("POP_MIN") or 0),
            r.get("NAMEASCII") or r.get("NAME") or "",
        )
    )
    kept = rows[:TARGET_CITIES]

    cities = []
    for rank, row in enumerate(kept, start=1):
        code = row.get("ADM0_A3")
        cities.append(
            {
                "id": rank,
                "name": row.get("NAME") or row.get("NAMEASCII") or "Unnamed",
                "country": row.get("ADM0NAME") or "",
                "iso": row.get("ISO_A2") or "",
                "continent": continents.get(code, ""),
                "admin1": row.get("ADM1NAME") or "",
                "pop": int(row.get("POP_MAX") or 0),
                "popCity": int(row.get("POP_MIN") or 0),
                "lat": round(float(row["LATITUDE"]), 4),
                "lon": round(float(row["LONGITUDE"]), 4),
            }
        )

    os.makedirs(OUT_DIR, exist_ok=True)

    with io.open(os.path.join(OUT_DIR, "cities.json"), "w", encoding="utf-8") as f:
        json.dump(
            {
                "total": len(cities),
                "largestPop": cities[0]["pop"],
                "smallestPop": cities[-1]["pop"],
                "cities": cities,
            },
            f,
            separators=(",", ":"),
            ensure_ascii=False,
        )

    rings = load_coastline()
    with io.open(os.path.join(OUT_DIR, "coastline.json"), "w", encoding="utf-8") as f:
        json.dump(
            {
                "lonLatRings": [
                    [[round(lon, 3), round(lat, 3)] for lon, lat in ring]
                    for ring in rings
                ]
            },
            f,
            separators=(",", ":"),
            ensure_ascii=False,
        )

    by_country = {}
    by_continent = {}
    for city in cities:
        by_country[city["country"]] = by_country.get(city["country"], 0) + 1
        by_continent[city["continent"]] = by_continent.get(city["continent"], 0) + 1
    top = sorted(by_country.items(), key=lambda kv: -kv[1])[:8]
    north = sum(1 for c in cities if c["lat"] >= 0)
    missing = sum(1 for c in cities if not c["continent"])

    print(f"wrote {len(cities)} cities across {len(by_country)} countries")
    print(f"  #1 {cities[0]['name']} at {cities[0]['pop']:,}")
    print(f"  #999 {cities[-1]['name']} at {cities[-1]['pop']:,}")
    print(f"  ratio largest:smallest = {cities[0]['pop'] / cities[-1]['pop']:.1f}x")
    print(f"  {north} north of the equator, {len(cities) - north} south")
    print(f"  continents: {sorted(by_continent.items(), key=lambda kv: -kv[1])}")
    print(f"  cities with no continent: {missing}")
    print("largest holdings:", ", ".join(f"{n} {c}" for c, n in top))
    print(f"  coastline rings: {len(rings)}")


if __name__ == "__main__":
    main()
