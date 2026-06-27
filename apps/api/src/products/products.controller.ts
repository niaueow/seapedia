import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('SELLER')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    create(@CurrentUser() user: AuthUser, @Body() dto: CreateProductDto) {
        return this.productsService.createProduct(user.id, dto);
    }

    @Get('mine')
    listMine(
        @CurrentUser() user: AuthUser,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 20;
        return this.productsService.listMyProducts(user.id, pageNum, limitNum);
    }

    @Patch(':id')
    update(
        @CurrentUser() user: AuthUser,
        @Param('id') id: string,
        @Body() dto: UpdateProductDto,
    ) {
        return this.productsService.updateProduct(user.id, id, dto);
    }

    @Delete(':id')
    remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        return this.productsService.deleteProduct(user.id, id);
    }
}