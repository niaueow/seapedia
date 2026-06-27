import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
    constructor(private readonly prisma: PrismaService) { }

    async listProducts(params: {
        page?: number;
        limit?: number;
        q?: string;
        storeId?: string;
    }) {
        const page = params.page && params.page > 0 ? params.page : 1;
        const limit = params.limit && params.limit > 0 ? params.limit : 20;
        const skip = (page - 1) * limit;

        // Only active products are publicly visible.
        const where: any = { isActive: true };

        // Optional name search (case-insensitive "contains").
        if (params.q && params.q.trim().length > 0) {
            where.name = { contains: params.q.trim(), mode: 'insensitive' };
        }

        // Optional filter: only products from a specific store.
        if (params.storeId) {
            where.storeId = params.storeId;
        }

        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    description: true,
                    price: true,
                    stock: true,
                    imageUrl: true,
                    createdAt: true,
                    store: { select: { id: true, name: true } },
                },
            }),
            this.prisma.product.count({ where }),
        ]);

        return { data, page, limit, total };
    }

    async getProductById(id: string) {
        const product = await this.prisma.product.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                description: true,
                price: true,
                stock: true,
                imageUrl: true,
                isActive: true,
                createdAt: true,
                store: { select: { id: true, name: true } },
            },
        });

        // Hide it if it doesn't exist OR has been soft-deleted.
        if (!product || !product.isActive) {
            throw new NotFoundException('Product not found.');
        }

        return product;
    }
}