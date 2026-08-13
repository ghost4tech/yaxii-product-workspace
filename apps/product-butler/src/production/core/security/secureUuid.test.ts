import { describe, expect, it, vi } from "vitest";
import {
  generateSecureUuidV4,
  SecureRandomUnavailableError,
  type SecureCryptoSource,
} from "./secureUuid";

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe("generateSecureUuidV4", () => {
  it("uses randomUUID when the browser provides it", () => {
    const expected = "11111111-1111-4111-8111-111111111111";
    const randomUUID = vi.fn(() => expected);

    expect(generateSecureUuidV4({ randomUUID })).toBe(expected);
    expect(randomUUID).toHaveBeenCalledOnce();
  });

  it("creates a standards-compatible UUID v4 with getRandomValues when randomUUID is missing", () => {
    const getRandomValues = vi.fn((bytes: Uint8Array) => {
      bytes.fill(0);
      return bytes;
    });

    const uuid = generateSecureUuidV4({ getRandomValues });

    expect(uuid).toBe("00000000-0000-4000-8000-000000000000");
    expect(uuid).toMatch(UUID_V4_PATTERN);
    expect(getRandomValues).toHaveBeenCalledOnce();
  });

  it("generates distinct fallback UUIDs from distinct secure random bytes", () => {
    let fill = 0;
    const cryptoSource: SecureCryptoSource = {
      getRandomValues(bytes) {
        bytes.fill(fill);
        fill += 1;
        return bytes;
      },
    };

    expect(generateSecureUuidV4(cryptoSource)).not.toBe(generateSecureUuidV4(cryptoSource));
  });

  it("fails explicitly when secure cryptographic randomness is unavailable", () => {
    expect(() => generateSecureUuidV4(null)).toThrowError(SecureRandomUnavailableError);
    expect(() => generateSecureUuidV4({})).toThrow("Secure cryptographic randomness is unavailable.");
  });
});
