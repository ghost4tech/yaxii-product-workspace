import { generateSecureUuidV4 } from "../../core/security/secureUuid";

export class IdempotencyKeyManager {
  private current: { fingerprint: string; key: string; locked: boolean } | null = null;

  public forRequest(request: unknown): string {
    const fingerprint = JSON.stringify(request);
    if (this.current?.locked) return this.current.key;
    if (this.current?.fingerprint === fingerprint) return this.current.key;
    const key = generateSecureUuidV4();
    this.current = { fingerprint, key, locked: false };
    return key;
  }

  public lock(key: string): void {
    if (this.current?.key === key) this.current.locked = true;
  }

  public clear(key: string): void {
    if (this.current?.key === key) this.current = null;
  }
}
