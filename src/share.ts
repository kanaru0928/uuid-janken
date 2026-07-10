const X_INTENT_URL = "https://x.com/intent/tweet";

export function createWinnerShareUrl(
  playerNumber: 1 | 2,
  player0Uuid: string,
  player1Uuid: string,
  gameUrl: string,
): string {
  const url = new URL(X_INTENT_URL);
  url.searchParams.set(
    "text",
    `UUIDじゃんけんで遊びました！\n${player0Uuid} vs ${player1Uuid}\n\nPLAYER ${playerNumber}の勝利！\n${gameUrl}\n#UUIDじゃんけん`,
  );
  return url.toString();
}
