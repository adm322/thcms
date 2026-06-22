/** Format a number as Malaysian Ringgit, e.g. 3500 -> "RM 3,500". */
export function formatRM(amount: number): string {
  return `RM ${amount.toLocaleString("en-MY")}`;
}

/** Format a monthly rent, e.g. 3500 -> "RM 3,500/mo". */
export function formatRent(amount: number): string {
  return `${formatRM(amount)}/mo`;
}

/** Human-friendly date string, e.g. "18 Jun 2026". */
export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-MY", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}
