import { describe, expect, it } from "vite-plus/test";
import { createWinnerShareUrl } from "./share";

describe("勝者の共有URL", () => {
  it("勝者とUUIDを含むXの共有URLを作る", () => {
    const url = new URL(createWinnerShareUrl(1, "123e4567-e89b-42d3-a456-426614174000"));

    expect(url.origin).toBe("https://x.com");
    expect(url.pathname).toBe("/intent/tweet");
    expect(url.searchParams.get("text")).toBe(
      "UUIDじゃんけん\n結果: PLAYER 1の勝利！\nUUID: 123e4567-e89b-42d3-a456-426614174000",
    );
  });
});
