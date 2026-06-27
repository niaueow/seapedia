import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/strategies/jwt.strategy';

@Controller('stores')
@UseGuards(JwtAuthGuard, RolesGuard) // every route here: logged in + role-checked
export class StoresController {
  constructor(private readonly storesService: StoresService) { }

  @Post()
  @Roles('SELLER')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateStoreDto) {
    return this.storesService.createStore(user.id, dto);
  }

  @Get('mine')
  @Roles('SELLER')
  getMine(@CurrentUser() user: AuthUser) {
    return this.storesService.getMyStore(user.id);
  }

  @Patch(':id')
  @Roles('SELLER')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateStoreDto,
  ) {
    return this.storesService.updateStore(user.id, id, dto);
  }
}