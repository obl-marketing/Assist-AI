import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ExpertService, PricingModel } from '@prisma/client';

export interface PriceBreakdown {
  base: number;
  platformFee: number;
  tax: number;
  total: number; // charged to the seeker
  expertPayout: number; // take-home before the expert's own taxes
}

@Injectable()
export class PricingService {
  private readonly platformBps: number;
  private readonly gstBps: number;

  constructor(config: ConfigService) {
    this.platformBps = Number(config.get('PLATFORM_FEE_BPS') ?? 1500);
    this.gstBps = Number(config.get('GST_BPS') ?? 1800);
  }

  /** Base amount for a service (PER_MINUTE priced at consultation end). */
  baseFor(service: Pick<ExpertService, 'pricingModel' | 'sessionPrice' | 'productPrice' | 'ratePerMinute'>, minutes = 0): number {
    switch (service.pricingModel) {
      case PricingModel.FIXED_SESSION:
        return service.sessionPrice ?? 0;
      case PricingModel.PRODUCT:
        return service.productPrice ?? 0;
      case PricingModel.PER_MINUTE:
        return Math.max(1, Math.ceil(minutes)) * (service.ratePerMinute ?? 0);
      default:
        return 0;
    }
  }

  /**
   * Transparent money flow. Every figure is shown to both sides — no mystery.
   * The exact tax/commission treatment is finalised with finance/legal; the
   * split itself is always visible.
   */
  breakdown(base: number): PriceBreakdown {
    const platformFee = Math.round((base * this.platformBps) / 10000);
    const tax = Math.round(((base + platformFee) * this.gstBps) / 10000);
    const total = base + platformFee + tax;
    const expertPayout = base - platformFee; // fee is FREED's take on the base
    return { base, platformFee, tax, total, expertPayout };
  }

  /**
   * Non-binding pricing guidance for experts: "Typical price for similar
   * experts: ₹600–₹1,200". Never enforced — the expert sets their own price.
   */
  guidanceBand(peerPrices: number[]): { low: number; high: number } | null {
    if (peerPrices.length < 3) return null;
    const sorted = [...peerPrices].sort((a, b) => a - b);
    const at = (p: number) => sorted[Math.floor((sorted.length - 1) * p)];
    return { low: at(0.25), high: at(0.75) };
  }
}
