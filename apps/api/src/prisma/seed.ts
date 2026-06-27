import 'dotenv/config';
import { PrismaClient, RoleName } from '../generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL']! });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding database...');

    // 1) Ensure the four roles exist.
    const roleNames: RoleName[] = ['ADMIN', 'SELLER', 'BUYER', 'DRIVER'];
    for (const name of roleNames) {
        await prisma.role.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
    console.log('Roles ready.');

    // Helper: create (or update) a user, attach roles, and give them a wallet + cart.
    async function createUser(opts: {
        username: string;
        email: string;
        password: string;
        name: string;
        roles: RoleName[];
    }) {
        const passwordHash = await argon2.hash(opts.password);

        const user = await prisma.user.upsert({
            where: { username: opts.username },
            update: {},
            create: {
                username: opts.username,
                email: opts.email,
                passwordHash,
                name: opts.name,
                wallet: { create: { balance: 0 } },
                cart: { create: {} },
            },
        });

        // Attach each role via the UserRole join table.
        for (const roleName of opts.roles) {
            const role = await prisma.role.findUniqueOrThrow({
                where: { name: roleName },
            });
            await prisma.userRole.upsert({
                where: { userId_roleId: { userId: user.id, roleId: role.id } },
                update: {},
                create: { userId: user.id, roleId: role.id },
            });
        }

        return user;
    }

    // 2) Create starter accounts.
    await createUser({
        username: 'admin',
        email: 'admin@seapedia.test',
        password: 'Admin#123',
        name: 'Admin',
        roles: ['ADMIN'],
    });

    await createUser({
        username: 'buyer',
        email: 'buyer@seapedia.test',
        password: 'Buyer#123',
        name: 'Demo Buyer',
        roles: ['BUYER'],
    });

    const seller = await createUser({
        username: 'seller',
        email: 'seller@seapedia.test',
        password: 'Seller#123',
        name: 'Demo Seller',
        roles: ['SELLER'],
    });

    await createUser({
        username: 'driver',
        email: 'driver@seapedia.test',
        password: 'Driver#123',
        name: 'Demo Driver',
        roles: ['DRIVER'],
    });

    // A multi-role user (Buyer + Seller) to test the role-selection flow later.
    await createUser({
        username: 'multi',
        email: 'multi@seapedia.test',
        password: 'Multi#123',
        name: 'Multi Role',
        roles: ['BUYER', 'SELLER'],
    });

    // 3) Give the seller a store with a couple of products (handy for later steps).
    const store = await prisma.store.upsert({
        where: { ownerId: seller.id },
        update: {},
        create: {
            ownerId: seller.id,
            name: 'Toko Demo',
            description: 'A demo store for testing.',
        },
    });

    const demoProducts = [
        { name: 'Kaos Polos', description: 'Plain cotton t-shirt', price: 75000, stock: 20 },
        { name: 'Topi Keren', description: 'A cool cap', price: 50000, stock: 15 },
    ];

    for (const p of demoProducts) {
        const existing = await prisma.product.findFirst({
            where: { storeId: store.id, name: p.name },
        });
        if (!existing) {
            await prisma.product.create({
                data: { ...p, storeId: store.id },
            });
        }
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });