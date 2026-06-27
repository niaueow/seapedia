import { IsInt, Max, Min } from 'class-validator';

export class TopupDto {
    // Amount in whole Rupiah. Must be a positive integer.
    // Max is a sanity cap to prevent absurd test values.
    @IsInt()
    @Min(1)
    @Max(1_000_000_000)
    amount!: number;
}