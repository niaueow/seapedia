import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
    UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckoutDto } from './dto/checkout.dto';
import { DELIVERY_FEES, PPN_RATE } from './delivery';

@Injectable()
export class CheckoutService {
    constructor(private readonly prisma: PrismaService) { }

    async checkout(userId: string, dto: CheckoutDto) {
        // Everything happens inside ONE interactive transaction.
        // If anything throws, ALL changes roll back automatically.
        return this.prisma.$transaction(async (tx) => {
            // ---- 1) Load the cart and its items (with product data) ----
            const cart = await tx.cart.findUnique({ where: { userId } });
            if (!cart) {
                throw new NotFoundException('Cart not found.');
            }

            const items = await tx.cartItem.findMany({
                where: { cartId: cart.id },
                include: { product: true },
            });

            if (items.length === 0) {
                throw new BadRequestException('Your cart is empty.');
            }
            if (!cart.storeId) {
                throw new BadRequestException('Your cart is not linked to a store.');
            }

            // ---- 2) Load and verify the shipping address belongs to this buyer ----
            const address = await tx.address.findUnique({
                where: { id: dto.addressId },
            });
            if (!address) {
                throw new NotFoundException('Address not found.');
            }
            if (address.userId !== userId) {
                throw new ForbiddenException('This is not your address.');
            }

            // ---- 3) Compute totals (PPN on subtotal only) ----
            let subtotal = 0;
            for (const item of items) {
                subtotal += item.product.price * item.quantity;
            }
            const deliveryFee = DELIVERY_FEES[dto.deliveryMethod];
            const ppnAmount = Math.round(subtotal * PPN_RATE);
            const total = subtotal + ppnAmount + deliveryFee;

            // ---- 4) Verify the wallet has enough balance ----
            const wallet = await tx.wallet.findUnique({ where: { userId } });
            if (!wallet) {
                throw new NotFoundException('Wallet not found.');
            }
            if (wallet.balance < total) {
                throw new UnprocessableEntityException({
                    code: 'INSUFFICIENT_BALANCE',
                    message: `Your balance (${wallet.balance}) is less than the total (${total}).`,
                });
            }

            // ---- 5) Safely decrement stock for each item ----
            // The guarded updateMany only succeeds if stock is still enough.
            for (const item of items) {
                const result = await tx.product.updateMany({
                    where: { id: item.productId, stock: { gte: item.quantity } },
                    data: { stock: { decrement: item.quantity } },
                });
                if (result.count === 0) {
                    // Not enough stock (maybe sold out moments ago) -> roll everything back.
                    throw new UnprocessableEntityException({
                        code: 'INSUFFICIENT_STOCK',
                        message: `Not enough stock for "${item.product.name}".`,
                    });
                }
            }

            // ---- 6) Debit the wallet + write a ledger entry ----
            const newBalance = wallet.balance - total;
            await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: newBalance },
            });

            // ---- 7) Create the order (with snapshots of address) ----
            const order = await tx.order.create({
                data: {
                    buyerId: userId,
                    storeId: cart.storeId,
                    deliveryMethod: dto.deliveryMethod,
                    recipientName: address.recipientName,
                    recipientPhone: address.phone,
                    shippingAddress: address.fullAddress,
                    subtotal,
                    deliveryFee,
                    ppnAmount,
                    total,
                    status: 'SEDANG_DIKEMAS',
                },
            });

            // Now that we have the order id, record the ledger reference.
            await tx.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'CHECKOUT_DEBIT',
                    amount: total,
                    balanceAfter: newBalance,
                    referenceId: order.id,
                    description: 'Checkout payment',
                },
            });

            // ---- 8) Create order items (with snapshots of name + price) ----
            for (const item of items) {
                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        productId: item.productId,
                        productName: item.product.name,
                        unitPrice: item.product.price,
                        quantity: item.quantity,
                        lineTotal: item.product.price * item.quantity,
                    },
                });
            }

            // ---- 9) Record the initial status history ----
            await tx.orderStatusHistory.create({
                data: {
                    orderId: order.id,
                    status: 'SEDANG_DIKEMAS',
                    note: 'Order placed.',
                },
            });

            // ---- 10) Empty the cart and unlock it ----
            await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
            await tx.cart.update({
                where: { id: cart.id },
                data: { storeId: null },
            });

            // ---- 11) Return the full order with items ----
            return tx.order.findUnique({
                where: { id: order.id },
                include: { items: true, statusHistory: true },
            });
        });
    }
}