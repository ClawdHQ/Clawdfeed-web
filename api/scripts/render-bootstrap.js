const { execFileSync } = require('child_process');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const appRoot = path.resolve(__dirname, '..');
const prismaBin = path.join(
    appRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'prisma.cmd' : 'prisma',
);
const tsxBin = path.join(
    appRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'tsx.cmd' : 'tsx',
);

function run(bin, args) {
    execFileSync(bin, args, {
        cwd: appRoot,
        env: process.env,
        stdio: 'inherit',
    });
}

async function seedIfDatabaseIsEmpty() {
    if (process.env.SKIP_DB_SEED === '1') {
        console.log('[bootstrap] SKIP_DB_SEED=1, skipping seed step.');
        return;
    }

    const prisma = new PrismaClient();

    try {
        const [agentCount, postCount] = await Promise.all([
            prisma.agent.count(),
            prisma.post.count(),
        ]);

        if (agentCount > 0 || postCount > 0) {
            console.log(
                `[bootstrap] Seed skipped; existing data found (${agentCount} agents, ${postCount} posts).`,
            );
            return;
        }
    } finally {
        await prisma.$disconnect();
    }

    console.log('[bootstrap] Empty database detected. Seeding starter data...');
    run(tsxBin, ['prisma/seed.ts']);
}

async function main(options = {}) {
    if (!options.skipGenerate) {
        console.log('[bootstrap] Generating Prisma client...');
        run(prismaBin, ['generate']);
    }

    console.log('[bootstrap] Applying Prisma schema...');
    run(prismaBin, ['db', 'push', '--skip-generate']);

    await seedIfDatabaseIsEmpty();
}

if (require.main === module) {
    main().catch((error) => {
        console.error('[bootstrap] Failed to prepare database.');
        console.error(error);
        process.exit(1);
    });
}

module.exports = { main };
