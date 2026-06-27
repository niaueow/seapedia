import { DeliveryMethod } from '../generated/prisma/enums.js';

// Delivery fees in whole Rupiah, keyed by method.
export const DELIVERY_FEES: Record<DeliveryMethod, number> = {
    INSTANT: 30000,
    NEXT_DAY: 20000,
    REGULAR: 10000,
};

// PPN (VAT) rate applied to the subtotal only.
export const PPN_RATE = 0.12;