import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
    constructor(private readonly catalogService: CatalogService) { }

    // Public: list active products, with optional search/filter/pagination.
    @Get('products')
    list(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('q') q?: string,
        @Query('storeId') storeId?: string,
    ) {
        return this.catalogService.listProducts({
            page: page ? parseInt(page, 10) : undefined,
            limit: limit ? parseInt(limit, 10) : undefined,
            q,
            storeId,
        });
    }

    // Public: single product detail.
    @Get('products/:id')
    getOne(@Param('id') id: string) {
        return this.catalogService.getProductById(id);
    }
}