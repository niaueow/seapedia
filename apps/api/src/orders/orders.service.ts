import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '../generated/prisma/enums.js';

@Injectable()
export class OrdersService {
    constructor(private readonly prisma: PrismaService) { }

    // ---------- BUYER: list my orders ----------
    async listBuyerOrders(
        userId: string,
        page = 1,
        limit = 20,
        status?: OrderStatus,
    ) {
        const skip = (page - 1) * limit;
        const where: any = { buyerId: userId };
        if (status) {
            where.status = status;
        }

        const [data, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    storeId: true,
                    deliveryMethod: true,
                    subtotal: true,
                    deliveryFee: true,
                    ppnAmount: true,
                    total: true,
                    status: true,
                    createdAt: true,
                    store: { select: { id: true, name: true } },
                    _count: { select: { items: true } },
                },
            }),
            this.prisma.order.count({ where }),
        ]);

        return { data, page, limit, total };
    }

    // ---------- BUYER: view one of my orders in detail ----------
    async getBuyerOrderDetail(userId: string, orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                statusHistory: { orderBy: { createdAt: 'asc' } },
                store: { select: { id: true, name: true } },
            },
        });
        if (!order) {
            throw new NotFoundException('Order not found.');
        }
        if (order.buyerId !== userId) {
            throw new ForbiddenException('This is not your order.');
        }
        return order;
    }

    // ---------- SELLER: list orders placed at my store ----------
    async listSellerOrders(
        userId: string,
        page = 1,
        limit = 20,
        status?: OrderStatus,
    ) {
        // Find the seller's store first.
        const store = await this.prisma.store.findUnique({
            where: { ownerId: userId },
        });
        if (!store) {
            throw new NotFoundException('You do not have a store.');
        }

        const skip = (page - 1) * limit;
        const where: any = { storeId: store.id };
        if (status) {
            where.status = status;
        }

        const [data, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    deliveryMethod: true,
                    recipientName: true,
                    subtotal: true,
                    deliveryFee: true,
                    ppnAmount: true,
                    total: true,
                    status: true,
                    createdAt: true,
                    _count: { select: { items: true } },
                },
            }),
            this.prisma.order.count({ where }),
        ]);

        return { data, page, limit, total };
    }

    // ---------- SELLER: view one order at my store in detail ----------
    async getSellerOrderDetail(userId: string, orderId: string) {
        const store = await this.prisma.store.findUnique({
            where: { ownerId: userId },
        });
        if (!store) {
            throw new NotFoundException('You do not have a store.');
        }

        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: true,
                statusHistory: { orderBy: { createdAt: 'asc' } },
            },
        });
        if (!order) {
            throw new NotFoundException('Order not found.');
        }
        if (order.storeId !== store.id) {
            throw new ForbiddenException('This order is not for your store.');
        }
        return order;
    }
}