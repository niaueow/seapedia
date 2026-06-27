import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddItemDto } from './dto/add-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

@Controller('cart')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @Get()
    getCart(@CurrentUser() user: AuthUser) {
        return this.cartService.getCartSummary(user.id);
    }

    @Post('items')
    addItem(@CurrentUser() user: AuthUser, @Body() dto: AddItemDto) {
        return this.cartService.addItem(user.id, dto.productId, dto.quantity);
    }

    @Patch('items/:id')
    updateItem(
        @CurrentUser() user: AuthUser,
        @Param('id') id: string,
        @Body() dto: UpdateItemDto,
    ) {
        return this.cartService.updateItem(user.id, id, dto.quantity);
    }

    @Delete('items/:id')
    removeItem(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        return this.cartService.removeItem(user.id, id);
    }

    @Delete()
    clear(@CurrentUser() user: AuthUser) {
        return this.cartService.clearCart(user.id);
    }
}