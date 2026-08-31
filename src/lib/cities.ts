import cityData from "@/data/cities.json";
import coastlineData from "@/data/coastline.json";

/*
 * The 999 cities and the coastline they sit on, generated once by
 * scripts/build-cities.py and committed. Nothing is projected or fetched at
 * runtime.
 *
 * The globe needs spherical coordinates, and rotating a sphere every frame
 * means turning lon/lat into unit vectors thousands of times a second if it
 * is done naively. So every point on the map — city centres, every
 * coastline vertex — is converted to a 3D unit vector exactly once here.
 * Drawing a frame is then a rotation and a cull, with no trigonometry per
 * point.
 */

export interface City {
  /** Rank by metro population. #1 is the largest city on Earth. */
  id: number;
  name: string;
  country: string;
  /** ISO 3166-1 alpha-2, for flags and grouping. */
  iso: string;
  continent: string;
  /** State, province or region. Empty for city-states. */
  admin1: string;
  /** Metro population. */
  pop: number;
  /** City proper, always smaller than `pop` and often much smaller. */
  popCity: number;
  lat: number;
  lon: number;
}

export const cities = cityData.cities as City[];
export const LARGEST_POP = cityData.largestPop as number;
export const SMALLEST_POP = cityData.smallestPop as number;

const byId = new Map(cities.map((city) => [city.id, city]));
export function cityById(id: number): City | undefined {
  return byId.get(id);
}

// ---- spherical geometry -------------------------------------------------

const DEG = Math.PI / 180;

/** Longitude/latitude in degrees to a unit vector. (0,0) faces the viewer. */
function toVector(lonDeg: number, latDeg: number): [number, number, number] {
  const lon = lonDeg * DEG;
  const lat = latDeg * DEG;
  const cosLat = Math.cos(lat);
  return [cosLat * Math.sin(lon), Math.sin(lat), cosLat * Math.cos(lon)];
}

/** City centres as unit vectors, in rank order. */
export const cityCentres = new Float64Array(cities.length * 3);
cities.forEach((city, index) => {
  const [x, y, z] = toVector(city.lon, city.lat);
  cityCentres[index * 3] = x;
  cityCentres[index * 3 + 1] = y;
  cityCentres[index * 3 + 2] = z;
});

/**
 * How big each city draws, 0–1, in rank order.
 *
 * The square root is the whole point: a disc's area grows with the square
 * of its radius, so scaling the radius by population directly would draw
 * Tokyo five thousand times the size of the smallest city instead of
 * seventy-one times. Taking the root puts the *area* in proportion, which
 * is the only reading that does not lie.
 */
export const cityWeights = new Float32Array(cities.length);
cities.forEach((city, index) => {
  cityWeights[index] = Math.sqrt(city.pop / LARGEST_POP);
});

/** Coastline rings as unit vectors. */
const lonLatRings = (coastlineData.lonLatRings ?? []) as [number, number][][];
export const coastVectors: Float64Array[] = lonLatRings.map((ring) => {
  const out = new Float64Array(ring.length * 3);
  ring.forEach(([lon, lat], index) => {
    const [x, y, z] = toVector(lon, lat);
    out[index * 3] = x;
    out[index * 3 + 1] = y;
    out[index * 3 + 2] = z;
  });
  return out;
});

/** Graticule: meridians every 30°, parallels every 30°, as unit vectors. */
export const graticule: Float64Array[] = (() => {
  const lines: Float64Array[] = [];
  for (let lon = -180; lon < 180; lon += 30) {
    const points: number[] = [];
    for (let lat = -80; lat <= 80; lat += 4) points.push(...toVector(lon, lat));
    lines.push(new Float64Array(points));
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const points: number[] = [];
    for (let lon = -180; lon <= 180; lon += 4) points.push(...toVector(lon, lat));
    lines.push(new Float64Array(points));
  }
  return lines;
})();

// ---- search -------------------------------------------------------------

/**
 * Accent-blind, case-blind form of a string.
 *
 * Nobody types the diacritics. Someone looking for São Paulo types "sao
 * paulo", someone looking for Malmö types "malmo", and a search that makes
 * them get it right is a search that tells most of the world its cities are
 * missing. NFD splits a letter from its accent and the range strips the
 * accents, which handles every latinised name in the set.
 */
function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const index = cities.map((city) => ({
  city,
  name: fold(city.name),
  country: fold(city.country),
}));

/**
 * Cities matching a query, best first.
 *
 * The tiers are the ranking, and within a tier the bigger city wins — which
 * is what `id` already means. So "san" puts San Antonio above San Bernardino
 * without any scoring, and typing a country name lists that country's cities
 * largest first, which is a useful thing to be able to do by accident.
 */
export function searchCities(query: string, limit = 7): City[] {
  const q = fold(query);
  if (q.length === 0) return [];

  const tiers: City[][] = [[], [], [], []];
  for (const entry of index) {
    let tier = -1;
    if (entry.name.startsWith(q)) tier = 0;
    else if (entry.name.includes(q)) tier = 1;
    else if (entry.country.startsWith(q)) tier = 2;
    else if (entry.country.includes(q)) tier = 3;
    if (tier >= 0) tiers[tier].push(entry.city);
  }

  const out: City[] = [];
  for (const tier of tiers) {
    for (const city of tier) {
      if (out.length >= limit) return out;
      out.push(city);
    }
  }
  return out;
}

// ---- formatting ---------------------------------------------------------

/** Population, short. 35,676,000 reads as 35.7M. */
export function population(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

/** Where a city is, as a reading rather than a grid reference. */
export function coordinates(lat: number, lon: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(2)}°${ns} ${Math.abs(lon).toFixed(2)}°${ew}`;
}
