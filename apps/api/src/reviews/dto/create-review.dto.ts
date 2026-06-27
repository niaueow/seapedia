import { IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateReviewDto {
    @IsString()
    @MinLength(2)
    @MaxLength(60)
    reviewerName!: string;

    @IsInt()
    @Min(1)
    @Max(5)
    rating!: number;

    @IsString()
    @MinLength(3)
    @MaxLength(1000)
    comment!: string;
}