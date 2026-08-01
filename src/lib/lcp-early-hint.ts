/** Guess LCP preload URL from PDP pathname for 103 Early Hints. Feed URLs require DB lookup — no-op. */
export function productLcpHintUrl(_pathname: string): string | null {
  return null;
}
