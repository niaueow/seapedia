import {
    IsBoolean,
    IsOptional,
    IsString,
    MaxLength,
    MinLength,
} from 'class-validator';

export class CreateAddressDto {
    @IsOptional()
    @IsString()
    @MaxLength(50)
    label?: string;

    @IsString()
    @MinLength(2)
    @MaxLength(100)
    recipientName!: string;

    @IsString()
    @MinLength(5)
    @MaxLength(20)
    phone!: string;

    @IsString()
    @MinLength(5)
    @MaxLength(500)
    fullAddress!: string;

    @IsOptional()
    @IsString()
    @MaxLength(100)
    city?: string;

    @IsOptional()
    @IsString()
    @MaxLength(20)
    postalCode?: string;

    @IsOptional()
    @IsBoolean()
    isDefault?: boolean;
}