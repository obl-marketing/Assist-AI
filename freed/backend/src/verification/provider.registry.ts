import { Injectable } from '@nestjs/common';
import { VerificationSourceKey } from '@prisma/client';
import { ALL_PROVIDERS } from './providers';
import { CredentialInput, VerificationProvider } from './providers/provider.interface';

/**
 * Resolves the right verification provider for a credential. This is the
 * "pluggable, source-by-source" seam: register a new authority by adding a
 * provider, no change to the calling code.
 */
@Injectable()
export class ProviderRegistry {
  private readonly providers: VerificationProvider[] = ALL_PROVIDERS;

  resolve(credential: CredentialInput): VerificationProvider {
    const match = this.providers.find((p) => p.supports(credential));
    // GenericDocumentProvider.supports() always returns true, so this is safe.
    return match as VerificationProvider;
  }

  get(key: VerificationSourceKey): VerificationProvider | undefined {
    return this.providers.find((p) => p.key === key);
  }

  list(): VerificationSourceKey[] {
    return this.providers.map((p) => p.key);
  }
}
