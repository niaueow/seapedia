import {
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
    constructor(private readonly prisma: PrismaService) { }

    async listAddresses(userId: string) {
        // Default address first, then newest.
        return this.prisma.address.findMany({
            where: { userId },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });
    }

    // Shared ownership check.
    private async getOwnedAddressOrThrow(userId: string, addressId: string) {
        const address = await this.prisma.address.findUnique({
            where: { id: addressId },
        });
        if (!address) {
            throw new NotFoundException('Address not found.');
        }
        if (address.userId !== userId) {
            throw new ForbiddenException('This is not your address.');
        }
        return address;
    }

    async createAddress(userId: string, dto: CreateAddressDto) {
        const makeDefault = dto.isDefault === true;

        if (makeDefault) {
            // Setting this as default: un-set others + create, in one transaction.
            const [, created] = await this.prisma.$transaction([
                this.prisma.address.updateMany({
                    where: { userId, isDefault: true },
                    data: { isDefault: false },
                }),
                this.prisma.address.create({
                    data: {
                        userId,
                        label: dto.label,
                        recipientName: dto.recipientName,
                        phone: dto.phone,
                        fullAddress: dto.fullAddress,
                        city: dto.city,
                        postalCode: dto.postalCode,
                        isDefault: true,
                    },
                }),
            ]);
            return created;
        }

        // Not default: simple create.
        const created = await this.prisma.address.create({
            data: {
                userId,
                label: dto.label,
                recipientName: dto.recipientName,
                phone: dto.phone,
                fullAddress: dto.fullAddress,
                city: dto.city,
                postalCode: dto.postalCode,
                isDefault: false,
            },
        });

        // If this is the buyer's FIRST address, make it default automatically.
        const count = await this.prisma.address.count({ where: { userId } });
        if (count === 1) {
            return this.prisma.address.update({
                where: { id: created.id },
                data: { isDefault: true },
            });
        }

        return created;
    }

    async updateAddress(
        userId: string,
        addressId: string,
        dto: UpdateAddressDto,
    ) {
        await this.getOwnedAddressOrThrow(userId, addressId);

        // If turning THIS address into the default, un-set the others first.
        if (dto.isDefault === true) {
            await this.prisma.$transaction([
                this.prisma.address.updateMany({
                    where: { userId, isDefault: true, NOT: { id: addressId } },
                    data: { isDefault: false },
                }),
                this.prisma.address.update({
                    where: { id: addressId },
                    data: {
                        label: dto.label,
                        recipientName: dto.recipientName,
                        phone: dto.phone,
                        fullAddress: dto.fullAddress,
                        city: dto.city,
                        postalCode: dto.postalCode,
                        isDefault: true,
                    },
                }),
            ]);
            return this.prisma.address.findUnique({ where: { id: addressId } });
        }

        // Otherwise a plain update (we don't allow un-setting the only default to none here).
        return this.prisma.address.update({
            where: { id: addressId },
            data: {
                label: dto.label,
                recipientName: dto.recipientName,
                phone: dto.phone,
                fullAddress: dto.fullAddress,
                city: dto.city,
                postalCode: dto.postalCode,
                isDefault: dto.isDefault,
            },
        });
    }

    async deleteAddress(userId: string, addressId: string) {
        const address = await this.getOwnedAddressOrThrow(userId, addressId);

        await this.prisma.address.delete({ where: { id: addressId } });

        // If we deleted the default and others remain, promote the newest to default.
        if (address.isDefault) {
            const next = await this.prisma.address.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });
            if (next) {
                await this.prisma.address.update({
                    where: { id: next.id },
                    data: { isDefault: true },
                });
            }
        }

        return { success: true };
    }
}