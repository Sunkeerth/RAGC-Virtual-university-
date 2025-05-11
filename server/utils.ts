// src/lib/utils.ts
import { randomBytes } from "crypto";

/**
 * Generate a cryptographically‑secure random ID of the given hex string length.
 * @param length Number of hex characters in the output ID.
 * @returns A hex string of exactly `length` characters.
 */
export function generateId(length: number): string {
  // Each byte yields two hex characters, so we need length/2 bytes (rounded up)
  const bytes = randomBytes(Math.ceil(length / 2));
  // Convert to hex and trim to desired length
  return bytes.toString("hex").slice(0, length);
}
