import {
    Controller,
    Get,
    Param,
    Query,
    UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';
import { OrderStatus } from '../generated/prisma/enums.js';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    // ----- Buyer routes -----
    @Get('orders')
    @Roles('BUYER')
    listMine(
        @CurrentUser() user: AuthUser,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: OrderStatus,
    ) {
        return this.ordersService.listBuyerOrders(
            user.id,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
            status,
        );
    }

    @Get('orders/:id')
    @Roles('BUYER')
    getMineDetail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        return this.ordersService.getBuyerOrderDetail(user.id, id);
    }

    // ----- Seller routes -----
    @Get('seller/orders')
    @Roles('SELLER')
    listSeller(
        @CurrentUser() user: AuthUser,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: OrderStatus,
    ) {
        return this.ordersService.listSellerOrders(
            user.id,
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 20,
            status,
        );
    }

    @Get('seller/orders/:id')
    @Roles('SELLER')
    getSellerDetail(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        return this.ordersService.getSellerOrderDetail(user.id, id);
    }
}