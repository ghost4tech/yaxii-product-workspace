import type { CreateProductRequest } from "../../domain/products";
import { generateSecureUuidV4 } from "../../core/security/secureUuid";

export class IdempotencyKeyManager {
  private current: { fingerprint: string; key: string } | null = null;

  public forRequest(request: CreateProductRequest): string {
    const fingerprint = JSON.stringify(request);
    if (this.current?.fingerprint === fingerprint) return this.current.key;
    const key = generateSecureUuidV4();
    this.current = { fingerprint, key };
    return key;
  }

  public clear(key: string): void {
    if (this.current?.key === key) this.current = null;
  }
}
