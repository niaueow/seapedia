import {
    ConflictException,
    BadRequestException,
    Injectable,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { RoleName } from '../generated/prisma/enums.js';

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService) { }

    async register(dto: RegisterDto) {
        // 1) Admin cannot self-register.
        if (dto.roles.includes(RoleName.ADMIN)) {
            throw new BadRequestException('Cannot self-register as ADMIN.');
        }

        // 2) Reject duplicate username or email early, with a clear message.
        const existing = await this.prisma.user.findFirst({
            where: {
                OR: [{ username: dto.username }, { email: dto.email }],
            },
        });
        if (existing) {
            throw new ConflictException('Username or email is already taken.');
        }

        // 3) Hash the password (never store it as plain text).
        const passwordHash = await argon2.hash(dto.password);

        // 4) Look up the Role rows for the requested role names.
        const roles = await this.prisma.role.findMany({
            where: { name: { in: dto.roles } },
        });

        // 5) Create the user + wallet + cart + role links, all in one transaction.
        const user = await this.prisma.user.create({
            data: {
                username: dto.username,
                email: dto.email,
                passwordHash,
                name: dto.name,
                wallet: { create: { balance: 0 } },
                cart: { create: {} },
                roles: {
                    create: roles.map((role) => ({ roleId: role.id })),
                },
            },
            include: {
                roles: { include: { role: true } },
            },
        });

        // 6) Return a SAFE response — never include passwordHash.
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            roles: user.roles.map((ur) => ur.role.name),
        };
    }
}