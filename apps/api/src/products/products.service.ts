import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) { }

    // Find the seller's store, or fail if they don't have one yet.
    private async getOwnedStoreOrThrow(userId: string) {
        const store = await this.prisma.store.findUnique({
            where: { ownerId: userId },
        });
        if (!store) {
            throw new NotFoundException(
                'You need to create a store before managing products.',
            );
        }
        return store;
    }

    async createProduct(userId: string, dto: CreateProductDto) {
        const store = await this.getOwnedStoreOrThrow(userId);

        return this.prisma.product.create({
            data: {
                storeId: store.id,
                name: dto.name,
                description: dto.description,
                price: dto.price,
                stock: dto.stock,
                imageUrl: dto.imageUrl,
            },
        });
    }

    async listMyProducts(userId: string, page = 1, limit = 20) {
        const store = await this.getOwnedStoreOrThrow(userId);

        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where: { storeId: store.id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.product.count({ where: { storeId: store.id } }),
        ]);

        return { data, page, limit, total };
    }

    // Shared ownership check: the product must belong to this seller's store.
    private async getOwnedProductOrThrow(userId: string, productId: string) {
        const store = await this.getOwnedStoreOrThrow(userId);
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });
        if (!product) {
            throw new NotFoundException('Product not found.');
        }
        if (product.storeId !== store.id) {
            throw new ForbiddenException('This product is not in your store.');
        }
        return product;
    }

    async updateProduct(
        userId: string,
        productId: string,
        dto: UpdateProductDto,
    ) {
        await this.getOwnedProductOrThrow(userId, productId);

        return this.prisma.product.update({
            where: { id: productId },
            data: {
                name: dto.name,
                description: dto.description,
                price: dto.price,
                stock: dto.stock,
                imageUrl: dto.imageUrl,
                isActive: dto.isActive,
            },
        });
    }

    async deleteProduct(userId: string, productId: string) {
        await this.getOwnedProductOrThrow(userId, productId);

        // Soft delete: hide it from the catalog but keep the row for order history.
        await this.prisma.product.update({
            where: { id: productId },
            data: { isActive: false },
        });
        return { success: true };
    }
}