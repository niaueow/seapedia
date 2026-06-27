import { IsEnum, IsString } from 'class-validator';
import { DeliveryMethod } from '../../generated/prisma/enums.js';

export class CheckoutDto {
    @IsString()
    addressId!: string;

    @IsEnum(DeliveryMethod)
    deliveryMethod!: DeliveryMethod;
}