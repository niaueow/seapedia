import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
    private _client: InstanceType<typeof PrismaClient>;

    constructor() {
        const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
        this._client = new PrismaClient({ adapter });
    }

    /** Expose the underlying Prisma client for direct model access. */
    get client(): InstanceType<typeof PrismaClient> {
        return this._client;
    }

    async onModuleInit() {
        // Open the connection to the database when the app starts.
        await this._client.$connect();
    }

    async onModuleDestroy() {
        // Close the connection cleanly when the app shuts down.
        await this._client.$disconnect();
    }
}
