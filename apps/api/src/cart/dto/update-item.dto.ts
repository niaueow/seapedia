import { IsInt, Min } from 'class-validator';

export class UpdateItemDto {
    // Allow 0 to mean "remove this item".
    @IsInt()
    @Min(0)
    quantity!: number;
}