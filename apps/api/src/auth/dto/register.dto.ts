import {
    IsArray,
    IsEmail,
    IsEnum,
    IsOptional,
    IsString,
    MinLength,
    ArrayMinSize,
} from 'class-validator';
import { RoleName } from '../../generated/prisma/enums.js';


export class RegisterDto {
    @IsString()
    @MinLength(3)
    username!: string;

    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(6)
    password!: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsArray()
    @ArrayMinSize(1)
    @IsEnum(RoleName, { each: true })
    roles!: RoleName[];
}