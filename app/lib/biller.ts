export const billerAccount = (text: string, biller?: Biller): string | undefined => {
  // 1. Try explicit keyword match first (added church, stand, unit)
  const explicit = text.match(
    /\b(?:meter|account|acc|smartcard|card|house|flat|stand|unit|order|church)\b\s*(?:no\.?|number|id|#)?\s*#?\s*([A-Za-z0-9-]{3,20})/i
  )?.[1];

  if (explicit) {
    // Strip hyphens if the biller expects digits only (e.g., ZESA or DSTV)
    return biller?.accountRegex?.source.startsWith("^\\d")
      ? explicit.replace(/-/g, "")
      : explicit;
  }

  // 2. Fallback: find a standalone token matching the biller's accountRegex
  if (biller?.accountRegex) {
    // Remove currency amounts like $20 or USD 20.50 first so they don't false-match
    const cleaned = text.replace(/(?:\$|usd|zig|zwg)\s*\d+(?:\.\d{1,2})?/gi, "");
    const tokens = cleaned.split(/\s+/);
    return tokens.find((t) => biller.accountRegex!.test(t));
  }

  return undefined;
};