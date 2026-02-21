export function parseWordList(input: string): string[] {
  return input
    .split(/[,\n]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && /^[a-zA-Z]+(?:['-][a-zA-Z]+)*$/.test(w))
}
