import { Controller, Get, Query } from '@nestjs/common';
import { Vertical } from '@prisma/client';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('verticals')
  verticals() {
    return this.catalog.verticals();
  }

  @Get('categories')
  categories(@Query('vertical') vertical?: Vertical) {
    return this.catalog.categories(vertical);
  }
}
