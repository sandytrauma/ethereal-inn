const PRIME = 15485863;        // A large prime number
const INVERSE = 1007823527;     // The modular multiplicative inverse of PRIME modulo 2^31-1
const MAX_INT = 2147483647;    // 2^31 - 1 (32-bit signed int max)

/**
 * Encodes a sequential integer database ID into a scrambled hexadecimal string
 */
export function scrambleId(id: number): string {
  if (isNaN(id) || id <= 0) return "";
  // Bijective mapping using modular multiplication
  const scrambled = BigInt(id) * BigInt(PRIME) % BigInt(MAX_INT);
  return Number(scrambled).toString(16);
}

/**
 * Decodes a scrambled hexadecimal string back into its original integer database ID
 */
export function unscrambleId(slug: string): number {
  if (!slug) return NaN;
  try {
    const scrambled = parseInt(slug, 16);
    if (isNaN(scrambled)) return NaN;
    const descrambled = BigInt(scrambled) * BigInt(INVERSE) % BigInt(MAX_INT);
    return Number(descrambled);
  } catch {
    return NaN;
  }
}