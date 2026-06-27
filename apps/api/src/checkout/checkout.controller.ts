import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Post,
    UseGuards,
} from '@nestjs/common';
import { CheckoutService } from './checkout.service';
import { CheckoutDto } from './dto/checkout.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

@Controller('checkout')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
export class CheckoutController {
    constructor(private readonly checkoutService: CheckoutService) { }

    @Post()
    @HttpCode(HttpStatus.CREATED)
    checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutDto) {
        return this.checkoutService.checkout(user.id, dto);
    }
}