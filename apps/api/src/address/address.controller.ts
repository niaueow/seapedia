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
import { AddressService } from './address.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

@Controller('addresses')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUYER')
export class AddressController {
    constructor(private readonly addressService: AddressService) { }

    @Get()
    list(@CurrentUser() user: AuthUser) {
        return this.addressService.listAddresses(user.id);
    }

    @Post()
    create(@CurrentUser() user: AuthUser, @Body() dto: CreateAddressDto) {
        return this.addressService.createAddress(user.id, dto);
    }

    @Patch(':id')
    update(
        @CurrentUser() user: AuthUser,
        @Param('id') id: string,
        @Body() dto: UpdateAddressDto,
    ) {
        return this.addressService.updateAddress(user.id, id, dto);
    }

    @Delete(':id')
    remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
        return this.addressService.deleteAddress(user.id, id);
    }
}