import { createHash, randomBytes } from "node:crypto";

const KEY_PREFIX = "capsa_sk_";

/** Generates a fresh raw agent API key. Shown to the user once, never stored. */
export function generateApiKey(): string {
  return KEY_PREFIX + randomBytes(32).toString("hex");
}

/**
 * Deterministic SHA-256 hash of a raw key. Only the hash is persisted, and the
 * same function is used to look up a connection by an incoming key.
 */
export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey.trim()).digest("hex");
}
