import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';

@Injectable()
export class StoresService {
    constructor(private readonly prisma: PrismaService) { }

    async createStore(userId: string, dto: CreateStoreDto) {
        // 1) One store per seller: reject if this user already owns one.
        const existingOwn = await this.prisma.store.findUnique({
            where: { ownerId: userId },
        });
        if (existingOwn) {
            throw new ConflictException('You already have a store.');
        }

        // 2) Store names must be unique across the whole app.
        const nameTaken = await this.prisma.store.findUnique({
            where: { name: dto.name },
        });
        if (nameTaken) {
            throw new ConflictException('That store name is already taken.');
        }

        // 3) Create the store owned by this user.
        return this.prisma.store.create({
            data: {
                ownerId: userId,
                name: dto.name,
                description: dto.description,
            },
        });
    }

    async updateStore(userId: string, storeId: string, dto: UpdateStoreDto) {
        // 1) The store must exist.
        const store = await this.prisma.store.findUnique({
            where: { id: storeId },
        });
        if (!store) {
            throw new NotFoundException('Store not found.');
        }

        // 2) Ownership: only the owner may edit it.
        if (store.ownerId !== userId) {
            throw new ForbiddenException('This is not your store.');
        }

        // 3) If renaming, make sure the new name isn't taken by someone else.
        if (dto.name && dto.name !== store.name) {
            const nameTaken = await this.prisma.store.findUnique({
                where: { name: dto.name },
            });
            if (nameTaken) {
                throw new ConflictException('That store name is already taken.');
            }
        }

        // 4) Apply the update.
        return this.prisma.store.update({
            where: { id: storeId },
            data: {
                name: dto.name,
                description: dto.description,
            },
        });
    }

    // Helper used later (and handy now): get the current seller's own store.
    async getMyStore(userId: string) {
        return this.prisma.store.findUnique({ where: { ownerId: userId } });
    }
}