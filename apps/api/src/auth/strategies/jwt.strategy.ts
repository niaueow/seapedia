import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RoleName } from '../../generated/prisma/enums.js';

// The shape of the data inside our JWT.
export interface JwtPayload {
    sub: string;
    username: string;
    roles: RoleName[];
    activeRole: RoleName | null;
    tokenVersion: number;
}

// The shape of what we attach to request.user after validation.
export interface AuthUser {
    id: string;
    username: string;
    roles: RoleName[];
    activeRole: RoleName | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        config: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        super({
            // Pull the token from the "Authorization: Bearer <token>" header.
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false, // reject expired tokens
            secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
        });
    }

    // Runs AFTER the signature + expiry are verified. `payload` is the decoded token.
    async validate(payload: JwtPayload): Promise<AuthUser> {
        // 1) Make sure the user still exists.
        const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            include: { roles: { include: { role: true } } },
        });
        if (!user) {
            throw new UnauthorizedException();
        }

        // 2) Reject tokens that were invalidated by logout (version bumped).
        if (user.tokenVersion !== payload.tokenVersion) {
            throw new UnauthorizedException('Token is no longer valid.');
        }

        // 3) Whatever we return here becomes request.user.
        return {
            id: user.id,
            username: user.username,
            roles: user.roles.map((ur) => ur.role.name),
            activeRole: payload.activeRole,
        };
    }
}