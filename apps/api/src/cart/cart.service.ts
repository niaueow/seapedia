import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
    constructor(private readonly prisma: PrismaService) { }

    // Get the buyer's cart (creating one if somehow missing).
    private async getCart(userId: string) {
        let cart = await this.prisma.cart.findUnique({ where: { userId } });
        if (!cart) {
            cart = await this.prisma.cart.create({ data: { userId } });
        }
        return cart;
    }

    // Build a friendly summary with computed totals.
    async getCartSummary(userId: string) {
        const cart = await this.getCart(userId);

        const items = await this.prisma.cartItem.findMany({
            where: { cartId: cart.id },
            orderBy: { createdAt: 'asc' },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        stock: true,
                        imageUrl: true,
                        isActive: true,
                        storeId: true,
                    },
                },
            },
        });

        let subtotal = 0;
        let itemCount = 0;
        const lines = items.map((item) => {
            const lineTotal = item.product.price * item.quantity;
            subtotal += lineTotal;
            itemCount += item.quantity;
            return {
                id: item.id,
                quantity: item.quantity,
                lineTotal,
                product: item.product,
            };
        });

        let store: { id: string; name: string } | null = null;
        if (cart.storeId) {
            store = await this.prisma.store.findUnique({
                where: { id: cart.storeId },
                select: { id: true, name: true },
            });
        }

        return {
            storeId: cart.storeId,
            store,
            items: lines,
            subtotal,
            itemCount,
        };
    }

    async addItem(userId: string, productId: string, quantity: number) {
        const cart = await this.getCart(userId);

        // 1) The product must exist and be active.
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product || !product.isActive) {
            throw new NotFoundException('Product not found.');
        }

        // 2) Single-store rule: if the cart is locked to a different store, reject.
        if (cart.storeId && cart.storeId !== product.storeId) {
            throw new ConflictException({
                code: 'DIFFERENT_STORE',
                message:
                    'Your cart can only contain products from one store. Empty your cart first.',
            });
        }

        // 3) Figure out the resulting quantity (existing + new, if already in cart).
        const existing = await this.prisma.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } },
        });
        const resultingQty = (existing?.quantity ?? 0) + quantity;

        // 4) Light stock check.
        if (resultingQty > product.stock) {
            throw new BadRequestException(
                `Only ${product.stock} in stock; you tried to add ${resultingQty}.`,
            );
        }

        // 5) Lock the cart to this store (if not already), then upsert the item.
        await this.prisma.$transaction([
            this.prisma.cart.update({
                where: { id: cart.id },
                data: { storeId: product.storeId },
            }),
            this.prisma.cartItem.upsert({
                where: { cartId_productId: { cartId: cart.id, productId } },
                update: { quantity: resultingQty },
                create: { cartId: cart.id, productId, quantity },
            }),
        ]);

        return this.getCartSummary(userId);
    }

    async updateItem(userId: string, cartItemId: string, quantity: number) {
        const cart = await this.getCart(userId);

        // The item must exist and belong to this buyer's cart.
        const item = await this.prisma.cartItem.findUnique({
            where: { id: cartItemId },
            include: { product: true },
        });
        if (!item) {
            throw new NotFoundException('Cart item not found.');
        }
        if (item.cartId !== cart.id) {
            throw new ForbiddenException('This item is not in your cart.');
        }

        // Quantity 0 means remove.
        if (quantity === 0) {
            return this.removeItem(userId, cartItemId);
        }

        // Light stock check.
        if (quantity > item.product.stock) {
            throw new BadRequestException(
                `Only ${item.product.stock} in stock.`,
            );
        }

        await this.prisma.cartItem.update({
            where: { id: cartItemId },
            data: { quantity },
        });

        return this.getCartSummary(userId);
    }

    async removeItem(userId: string, cartItemId: string) {
        const cart = await this.getCart(userId);

        const item = await this.prisma.cartItem.findUnique({
            where: { id: cartItemId },
        });
        if (!item) {
            throw new NotFoundException('Cart item not found.');
        }
        if (item.cartId !== cart.id) {
            throw new ForbiddenException('This item is not in your cart.');
        }

        await this.prisma.cartItem.delete({ where: { id: cartItemId } });

        // If the cart is now empty, unlock it from its store.
        const remaining = await this.prisma.cartItem.count({
            where: { cartId: cart.id },
        });
        if (remaining === 0) {
            await this.prisma.cart.update({
                where: { id: cart.id },
                data: { storeId: null },
            });
        }

        return this.getCartSummary(userId);
    }

    async clearCart(userId: string) {
        const cart = await this.getCart(userId);
        await this.prisma.$transaction([
            this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } }),
            this.prisma.cart.update({
                where: { id: cart.id },
                data: { storeId: null },
            }),
        ]);
        return this.getCartSummary(userId);
    }
}