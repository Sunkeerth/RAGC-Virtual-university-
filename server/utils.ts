import { randomBytes } from "crypto";

// Generate a random ID with specified length
export function generateId(length: number): string {
  const bytes = randomBytes(Math.ceil(length / 2));
  return bytes.toString("hex").slice(0, length);
}
