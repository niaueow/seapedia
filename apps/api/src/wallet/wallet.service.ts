import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
    constructor(private readonly prisma: PrismaService) { }

    // Get the wallet for a user, or fail clearly if missing.
    private async getWalletOrThrow(userId: string) {
        const wallet = await this.prisma.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            throw new NotFoundException('Wallet not found.');
        }
        return wallet;
    }

    async getBalance(userId: string) {
        const wallet = await this.getWalletOrThrow(userId);
        return { balance: wallet.balance };
    }

    async topup(userId: string, amount: number) {
        const wallet = await this.getWalletOrThrow(userId);
        const newBalance = wallet.balance + amount;

        // Do BOTH writes as one transaction: update balance + record the ledger entry.
        const [updatedWallet, transaction] = await this.prisma.$transaction([
            this.prisma.wallet.update({
                where: { id: wallet.id },
                data: { balance: newBalance },
            }),
            this.prisma.walletTransaction.create({
                data: {
                    walletId: wallet.id,
                    type: 'TOPUP',
                    amount,
                    balanceAfter: newBalance,
                    description: 'Wallet top-up',
                },
            }),
        ]);

        return {
            balance: updatedWallet.balance,
            transaction: {
                id: transaction.id,
                type: transaction.type,
                amount: transaction.amount,
                balanceAfter: transaction.balanceAfter,
                createdAt: transaction.createdAt,
            },
        };
    }

    async getHistory(userId: string, page = 1, limit = 20) {
        const wallet = await this.getWalletOrThrow(userId);
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.prisma.walletTransaction.findMany({
                where: { walletId: wallet.id },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
        ]);

        return { data, page, limit, total };
    }
}