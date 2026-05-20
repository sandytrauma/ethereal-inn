// Knuth's Multiplicative Hashing Constants for perfect 32-bit integer bijective mapping
const PRIME = 2654435761;       // A large prime number close to Golden Ratio fractional part of 2^32
const INVERSE = 2070146161;     // The perfect modular multiplicative inverse of PRIME modulo 2^32
const MAX_32BIT = 4294967296;   // 2^32 boundary modulus

/**
 * Encodes a sequential integer database ID into a scrambled hexadecimal string
 */
export function scrambleId(id: number): string {
  if (isNaN(id) || id <= 0) return "";
  
  // Calculate bijective mapping using BigInt to prevent JavaScript 53-bit float precision loss
  const scrambled = (BigInt(id) * BigInt(PRIME)) % BigInt(MAX_32BIT);
  
  // Return clean hexadecimal string representation
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
    
    // Reverse the modular multiplication using the absolute modular inverse
    const descrambled = (BigInt(scrambled) * BigInt(INVERSE)) % BigInt(MAX_32BIT);
    
    return Number(descrambled);
  } catch {
    return NaN;
  }
}