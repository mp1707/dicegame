/**
 * Format a number with "k" abbreviation for thousands.
 * Numbers under 1000 are returned as-is.
 * Examples: 800 → "800", 1232 → "1.2k", 10500 → "10.5k"
 */
export function formatCompactNumber(num: number): string {
  if (num < 1000) return num.toString();
  const k = num / 1000;
  // Use 1 decimal place, but strip trailing .0
  const formatted = k.toFixed(1).replace(/\.0$/, "");
  return `${formatted}k`;
}
