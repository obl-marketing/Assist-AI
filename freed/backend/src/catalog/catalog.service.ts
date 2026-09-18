import { Injectable } from '@nestjs/common';
import { Vertical } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { VERTICALS } from './verticals';

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /** The five verticals with their sub-categories (static taxonomy). */
  verticals() {
    return VERTICALS.map((v) => ({
      key: v.key,
      name: v.name,
      emoji: v.emoji,
      tagline: v.tagline,
      categoryCount: v.categories.length,
    }));
  }

  async categories(vertical?: Vertical) {
    return this.prisma.category.findMany({
      where: { active: true, ...(vertical ? { vertical } : {}) },
      orderBy: [{ vertical: 'asc' }, { order: 'asc' }],
    });
  }

  /** Idempotently seed the taxonomy into the DB. */
  async sync() {
    let n = 0;
    for (const v of VERTICALS) {
      let order = 0;
      for (const c of v.categories) {
        await this.prisma.category.upsert({
          where: { key: c.key },
          create: { key: c.key, name: c.name, blurb: c.blurb, vertical: v.key, order: order++ },
          update: { name: c.name, blurb: c.blurb, vertical: v.key, order: order++ },
        });
        n++;
      }
    }
    return { categories: n };
  }
}
