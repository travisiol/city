/**
 * The claim surface the site expects from the deployed contract.
 *
 * `claimedBitmap` is the important one and the reason it is worth speccing
 * the contract around this page rather than the other way round: the map
 * needs to know the state of all 999 cities at once, every time it draws.
 * 999 booleans pack into four 256-bit words, so the whole world is one
 * cheap view call instead of 999 ownerOf() lookups or an indexer.
 *
 * Bit n of word (n >> 8) is city n + 1 — city ids are 1-based to match
 * what the map labels, bits are 0-based.
 *
 * If the deployed contract names these differently, this file is the only
 * place to change.
 */
export const cityAbi = [
  {
    type: "function",
    name: "claim",
    stateMutability: "payable",
    inputs: [{ name: "cityId", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "claimedBitmap",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256[4]" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

/** Unpacks the four words into the set of claimed city ids. */
export function decodeClaimedBitmap(
  words: readonly bigint[],
  totalCities: number,
): Set<number> {
  const claimed = new Set<number>();
  for (let bit = 0; bit < totalCities; bit += 1) {
    const word = words[bit >> 8];
    if (word === undefined) continue;
    if ((word >> BigInt(bit & 255)) & 1n) claimed.add(bit + 1);
  }
  return claimed;
}
