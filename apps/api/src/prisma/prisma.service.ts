import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy {
    async onModuleInit() {
        // Open the connection to the database when the app starts.
        await this.$connect();
    }

    async onModuleDestroy() {
        // Close the connection cleanly when the app shuts down.
        await this.$disconnect();
    }
}