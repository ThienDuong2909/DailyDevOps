import path from 'node:path';
import { execFileSync } from 'node:child_process';

const adminEmail =
    process.env.PLAYWRIGHT_ADMIN_EMAIL || 'admin@devopsblog.com';
const adminPassword =
    process.env.PLAYWRIGHT_ADMIN_PASSWORD || 'Admin@123';

export default async function globalSetup() {
    const serverDir = path.resolve(__dirname, '../../../server-nodejs');
    const script = `
        const { PrismaClient } = require('@prisma/client');
        const argon2 = require('argon2');
        const prisma = new PrismaClient();

        async function main() {
            const password = await argon2.hash(${JSON.stringify(adminPassword)});
            await prisma.user.upsert({
                where: { email: ${JSON.stringify(adminEmail)} },
                update: {
                    password,
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'ADMIN',
                    isActive: true,
                    emailVerifiedAt: new Date(),
                    emailVerificationToken: null,
                    emailVerificationExpiresAt: null,
                    resetPasswordToken: null,
                    resetPasswordExpiresAt: null,
                },
                create: {
                    email: ${JSON.stringify(adminEmail)},
                    password,
                    firstName: 'Admin',
                    lastName: 'User',
                    role: 'ADMIN',
                    isActive: true,
                    emailVerifiedAt: new Date(),
                    emailVerificationToken: null,
                    emailVerificationExpiresAt: null,
                    resetPasswordToken: null,
                    resetPasswordExpiresAt: null,
                },
            });
            console.log('Playwright admin account ready:', ${JSON.stringify(adminEmail)});
        }

        main()
            .catch((error) => {
                console.error(error);
                process.exit(1);
            })
            .finally(async () => {
                await prisma.$disconnect();
            });
    `;

    execFileSync('node', ['-e', script], {
        cwd: serverDir,
        stdio: 'inherit',
    });
}
