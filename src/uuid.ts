import { racePlayer0Wins } from "./race";

export type UuidVersion = "v4" | "v7";

function writeUuidTimestamp(bytes: Uint8Array, timestampMs: number): void {
  const ts = BigInt(Math.floor(timestampMs));
  bytes[0] = Number((ts >> 40n) & 0xffn);
  bytes[1] = Number((ts >> 32n) & 0xffn);
  bytes[2] = Number((ts >> 24n) & 0xffn);
  bytes[3] = Number((ts >> 16n) & 0xffn);
  bytes[4] = Number((ts >> 8n) & 0xffn);
  bytes[5] = Number(ts & 0xffn);
}

function bytesToUuidString(bytes: Uint8Array): string {
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function generateUuidV4(): string {
  return crypto.randomUUID();
}

export function generateUuidV7(timestampMs: number = Date.now()): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  writeUuidTimestamp(bytes, timestampMs);

  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10

  return bytesToUuidString(bytes);
}

// Same v7 layout as generateUuidV7, but the top bit of rand_a (the 4 random
// bits right after the version nibble) is forced to encode the race winner
// instead of being random. Since the timestamp (and therefore every bit
// before it) is shared between the two UUIDs, that forced bit is the first
// bit where they differ, so it alone decides the comparison — the remaining
// 11 bits of rand_a plus all of rand_b stay genuinely random.
export function buildRacedUuidV7(timestampMs: number, isWinner: boolean): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  writeUuidTimestamp(bytes, timestampMs);

  bytes[6] = 0x70 | (isWinner ? 0x08 : 0x00) | (bytes[6] & 0x07);
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10

  return bytesToUuidString(bytes);
}

// v7 encodes a millisecond timestamp in its top 48 bits, so generating the two
// UUIDs at slightly different instants would let whoever's UUID is built later
// systematically win (a later timestamp sorts higher). Sharing one timestamp
// across both players removes that ordering bias, and the win/loss bit is
// then decided by racePlayer0Wins (see race.ts) rather than by RNG.
export async function generateRaceUuids(version: UuidVersion): Promise<[string, string]> {
  if (version === "v4") {
    return [generateUuidV4(), generateUuidV4()];
  }
  const now = Date.now();
  const player0Wins = await racePlayer0Wins();
  return [buildRacedUuidV7(now, player0Wins), buildRacedUuidV7(now, !player0Wins)];
}

export function compareUuids(a: string, b: string): "a" | "b" | "draw" {
  const n = (s: string) => s.replace(/-/g, "").toUpperCase();
  const na = n(a),
    nb = n(b);
  if (na > nb) return "a";
  if (na < nb) return "b";
  return "draw";
}
