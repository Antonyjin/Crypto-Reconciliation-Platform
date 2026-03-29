import { execSync } from 'child_process';

export default async function globalSetup() {
  process.env.DATABASE_URL =
    process.env.DATABASE_URL ??
    'postgresql://antonyjin:password@localhost:5433/crypto_recon_test';

  // Run prisma migrate to create tables in the test database
  execSync('npx prisma migrate deploy', {
    cwd: __dirname + '/..',
    env: { ...process.env },
    stdio: 'inherit',
  });
}
