import {
    BadRequestException,
    ConflictException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RoleName } from '../generated/prisma/enums.js';

@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
    ) { }

    // ---------- REGISTER (from Step 9) ----------
    async register(dto: RegisterDto) {
        if (dto.roles.includes(RoleName.ADMIN)) {
            throw new BadRequestException('Cannot self-register as ADMIN.');
        }

        const existing = await this.prisma.user.findFirst({
            where: { OR: [{ username: dto.username }, { email: dto.email }] },
        });
        if (existing) {
            throw new ConflictException('Username or email is already taken.');
        }

        const passwordHash = await argon2.hash(dto.password);

        const roles = await this.prisma.role.findMany({
            where: { name: { in: dto.roles } },
        });

        const user = await this.prisma.user.create({
            data: {
                username: dto.username,
                email: dto.email,
                passwordHash,
                name: dto.name,
                wallet: { create: { balance: 0 } },
                cart: { create: {} },
                roles: { create: roles.map((role) => ({ roleId: role.id })) },
            },
            include: { roles: { include: { role: true } } },
        });

        return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            roles: user.roles.map((ur) => ur.role.name),
        };
    }

    // ---------- Helper: build a signed access token ----------
    private async signAccessToken(params: {
        userId: string;
        username: string;
        roles: RoleName[];
        activeRole: RoleName | null;
        tokenVersion: number;
    }) {
        return this.jwt.signAsync({
            sub: params.userId,
            username: params.username,
            roles: params.roles,
            activeRole: params.activeRole,
            tokenVersion: params.tokenVersion,
        });
    }

    // ---------- LOGIN ----------
    async login(dto: LoginDto) {
        // 1) Find the user by username, including their roles.
        const user = await this.prisma.user.findUnique({
            where: { username: dto.username },
            include: { roles: { include: { role: true } } },
        });

        // 2) Verify the password. Use the SAME generic error whether the
        //    username is wrong or the password is wrong (don't leak which).
        const passwordOk =
            user && (await argon2.verify(user.passwordHash, dto.password));
        if (!user || !passwordOk) {
            throw new UnauthorizedException('Invalid username or password.');
        }

        const roles = user.roles.map((ur) => ur.role.name);

        // 3) Decide the active role:
        //    - exactly one role  -> activate it automatically
        //    - more than one      -> leave null; the user must pick next
        const activeRole = roles.length === 1 ? roles[0] : null;

        const accessToken = await this.signAccessToken({
            userId: user.id,
            username: user.username,
            roles,
            activeRole,
            tokenVersion: user.tokenVersion,
        });

        return {
            accessToken,
            requiresRoleSelection: activeRole === null,
            roles,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
            },
        };
    }

    // ---------- SELECT ROLE ----------
    async selectRole(userId: string, role: RoleName) {
        // 1) Load the user fresh (to confirm roles + current tokenVersion).
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { roles: { include: { role: true } } },
        });
        if (!user) {
            throw new UnauthorizedException();
        }

        const roles = user.roles.map((ur) => ur.role.name);

        // 2) The requested role must actually be owned by this user.
        if (!roles.includes(role)) {
            throw new BadRequestException('You do not have that role.');
        }

        // 3) Re-issue a token with the chosen active role baked in.
        const accessToken = await this.signAccessToken({
            userId: user.id,
            username: user.username,
            roles,
            activeRole: role,
            tokenVersion: user.tokenVersion,
        });

        return { accessToken, activeRole: role };
    }
    // ---------- LOGOUT ----------
    async logout(userId: string) {
        // Bump tokenVersion so every previously issued token becomes invalid.
        await this.prisma.user.update({
            where: { id: userId },
            data: { tokenVersion: { increment: 1 } },
        });
        return { success: true };
    }
}

