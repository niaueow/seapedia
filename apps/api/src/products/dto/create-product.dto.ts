import {
    IsInt,
    IsOptional,
    IsString,
    IsUrl,
    MaxLength,
    Min,
    MinLength,
} from 'class-validator';

export class CreateProductDto {
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    name!: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    // Money in whole Rupiah. Must be an integer >= 0.
    @IsInt()
    @Min(0)
    price!: number;

    // Stock count. Integer >= 0 (0 = out of stock).
    @IsInt()
    @Min(0)
    stock!: number;

    @IsOptional()
    @IsUrl()
    imageUrl?: string;
}