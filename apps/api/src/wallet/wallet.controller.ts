import {
    Body,
    Controller,
    Get,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
import { TopupDto } from './dto/topup.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

@Controller('wallet')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Get()
    getBalance(@CurrentUser() user: AuthUser) {
        return this.walletService.getBalance(user.id);
    }

    @Post('topup')
    topup(@CurrentUser() user: AuthUser, @Body() dto: TopupDto) {
        return this.walletService.topup(user.id, dto.amount);
    }

    @Get('history')
    history(
        @CurrentUser() user: AuthUser,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const limitNum = limit ? parseInt(limit, 10) : 20;
        return this.walletService.getHistory(user.id, pageNum, limitNum);
    }
}