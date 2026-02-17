export function parseWordList(input: string): string[] {
  return input
    .split(/[,\n]+/)
    .map((w) => w.trim().toLowerCase())
    .filter((w) => w.length > 0 && /^[a-z]+(?:['-][a-z]+)*$/.test(w))
}
