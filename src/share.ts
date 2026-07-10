const X_INTENT_URL = "https://x.com/intent/tweet";

export function createWinnerShareUrl(playerNumber: 1 | 2, uuid: string): string {
  const url = new URL(X_INTENT_URL);
  url.searchParams.set(
    "text",
    `UUIDじゃんけん\n結果: PLAYER ${playerNumber}の勝利！\nUUID: ${uuid}`,
  );
  return url.toString();
}
