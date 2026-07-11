import { describe, expect, it } from "vite-plus/test";
import {
  buildRacedUuidV7,
  compareUuids,
  generateRaceUuids,
  generateUuidV4,
  generateUuidV7,
} from "./uuid";

const HEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const timestampHex = (uuid: string) => uuid.replace(/-/g, "").slice(0, 12);

describe("UUID生成", () => {
  it("v4はバージョン4・バリアント10のUUIDを生成する", () => {
    const uuid = generateUuidV4();
    expect(uuid).toMatch(HEX);
    expect(uuid[14]).toBe("4");
    expect(["8", "9", "a", "b"]).toContain(uuid[19]);
  });

  it("v7はバージョン7・バリアント10のUUIDを生成する", () => {
    const uuid = generateUuidV7();
    expect(uuid).toMatch(HEX);
    expect(uuid[14]).toBe("7");
    expect(["8", "9", "a", "b"]).toContain(uuid[19]);
  });

  it("v7は指定したタイムスタンプを先頭48ビットに埋め込む", () => {
    const ts = 1_700_000_000_000;
    const uuid = generateUuidV7(ts);
    expect(timestampHex(uuid)).toBe(ts.toString(16).padStart(12, "0"));
  });
});

describe("レース結果を埋め込んだv7 UUID（buildRacedUuidV7）", () => {
  it("バージョン7・バリアント10のUUIDを生成する", () => {
    const uuid = buildRacedUuidV7(Date.now(), true);
    expect(uuid).toMatch(HEX);
    expect(uuid[14]).toBe("7");
    expect(["8", "9", "a", "b"]).toContain(uuid[19]);
  });

  it("指定したタイムスタンプを先頭48ビットに埋め込む", () => {
    const ts = 1_700_000_000_000;
    const uuid = buildRacedUuidV7(ts, true);
    expect(timestampHex(uuid)).toBe(ts.toString(16).padStart(12, "0"));
  });

  // ここが核心の不変条件: タイムスタンプが同じ2つのUUIDを作るとき、
  // isWinner=trueを渡した側は、rand_aの残りビットやrand_bがどんな乱数値で
  // あっても必ずcompareUuids上で勝つ（＝大きい方になる）。乱数を使う性質上
  // ワーカーによる統計的な検証はVitest上では困難/フレーキーになるため、代わりに
  // 「勝者ビットが確実に順序を支配する」という決定的な性質を数百回の乱数バリエー
  // ションで確認する。
  it("isWinner=trueの側は、乱数ビットの値によらず必ずcompareUuidsで勝つ", () => {
    const ts = Date.now();
    for (let i = 0; i < 500; i++) {
      const winner = buildRacedUuidV7(ts, true);
      const loser = buildRacedUuidV7(ts, false);
      expect(compareUuids(winner, loser)).toBe("a");
      expect(compareUuids(loser, winner)).toBe("b");
    }
  });
});

describe("対戦UUIDの生成", () => {
  it("v7では両者のタイムスタンプ部が完全に一致する", async () => {
    const [a, b] = await generateRaceUuids("v7");
    expect(timestampHex(a)).toBe(timestampHex(b));
  });

  it("v7では勝敗が必ずどちらかに決まり、引き分けにならない", async () => {
    const [a, b] = await generateRaceUuids("v7");
    expect(compareUuids(a, b)).not.toBe("draw");
  });

  it("v4では両者とも有効なUUID v4になる", async () => {
    const [a, b] = await generateRaceUuids("v4");
    expect(a[14]).toBe("4");
    expect(b[14]).toBe("4");
  });
});
