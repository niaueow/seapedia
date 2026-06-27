import { IsEnum } from 'class-validator';
import { RoleName } from '../../generated/prisma/enums.js';

export class SelectRoleDto {
    @IsEnum(RoleName)
    role!: RoleName;
}