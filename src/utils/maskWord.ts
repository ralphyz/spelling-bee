/**
 * Replace all occurrences of `word` in `text` with underscores,
 * matching case-insensitively and handling common suffixes (s, ed, ing, etc.).
 */
export function maskWordInText(text: string, word: string): string {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`${escaped}(s|ed|ing|er|ly|es|d)?`, 'gi')
  return text.replace(pattern, (match) => '_'.repeat(match.length))
}
