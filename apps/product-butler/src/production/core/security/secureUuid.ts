export interface SecureCryptoSource {
  getRandomValues?: (bytes: Uint8Array) => Uint8Array;
  randomUUID?: () => string;
}

export class SecureRandomUnavailableError extends Error {
  public constructor() {
    super("Secure cryptographic randomness is unavailable.");
    this.name = "SecureRandomUnavailableError";
  }
}

function formatUuid(bytes: Uint8Array): string {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

export function generateSecureUuidV4(
  cryptoSource: SecureCryptoSource | null | undefined = globalThis.crypto,
): string {
  if (typeof cryptoSource?.randomUUID === "function") {
    return cryptoSource.randomUUID();
  }
  if (typeof cryptoSource?.getRandomValues !== "function") {
    throw new SecureRandomUnavailableError();
  }

  const bytes = cryptoSource.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  return formatUuid(bytes);
}
