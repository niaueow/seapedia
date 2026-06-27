import {
    Body,
    Controller,
    Get,
    Post,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SelectRoleDto } from './dto/select-role.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthUser } from './strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    register(@Body() dto: RegisterDto) {
        return this.authService.register(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    login(@Body() dto: LoginDto) {
        return this.authService.login(dto);
    }

    // Protected: needs a valid token. Reads the user from the token.
    @Post('select-role')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    selectRole(@CurrentUser() user: AuthUser, @Body() dto: SelectRoleDto) {
        return this.authService.selectRole(user.id, dto.role);
    }

    // Protected: returns the currently logged-in user's info.
    @Get('profile')
    @UseGuards(JwtAuthGuard)
    profile(@CurrentUser() user: AuthUser) {
        return user;
    }

    // Protected: invalidates the user's tokens.
    @Post('logout')
    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    logout(@CurrentUser() user: AuthUser) {
        return this.authService.logout(user.id);
    }
}