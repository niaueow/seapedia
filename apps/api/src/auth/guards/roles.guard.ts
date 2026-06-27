import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleName } from '../../generated/prisma/enums.js';
import type { AuthUser } from '../strategies/jwt.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // 1) Read the roles required by this route (from the @Roles decorator).
        const requiredRoles = this.reflector.getAllAndOverride<RoleName[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        );

        // 2) If a route didn't declare any roles, allow it (auth-only).
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        // 3) Get the user the JwtAuthGuard attached to the request.
        const request = context.switchToHttp().getRequest();
        const user = request.user as AuthUser | undefined;

        // 4) The user must have an active role, and it must be allowed.
        if (!user || !user.activeRole) {
            throw new ForbiddenException(
                'You must select an active role before doing this.',
            );
        }
        if (!requiredRoles.includes(user.activeRole)) {
            throw new ForbiddenException(
                `This action requires one of these roles: ${requiredRoles.join(', ')}.`,
            );
        }

        return true;
    }
}