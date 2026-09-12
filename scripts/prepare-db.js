const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://postgres.sample:sample@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true";
}
if (!process.env.DIRECT_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}

const dbUrl = process.env.DATABASE_URL;
const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://') || !dbUrl.startsWith('file:');

console.log(`[Database Sync] Detected database URL protocol: ${isPostgres ? 'PostgreSQL (Cloud / Supabase)' : 'SQLite (Local)'}`);

// Update datasource provider in schema.prisma dynamically if needed
if (isPostgres) {
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  if (!schema.includes('directUrl')) {
    schema = schema.replace(
      /url\s*=\s*env\("DATABASE_URL"\)/g,
      'url       = env("DATABASE_URL")\n  directUrl = env("DIRECT_URL")'
    );
  }
} else {
  schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  schema = schema.replace(/\n\s*directUrl\s*=\s*env\("DIRECT_URL"\)/g, '');
}

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log(`[Database Sync] Updated schema.prisma provider to: ${isPostgres ? 'postgresql' : 'sqlite'}`);

try {
  console.log('[Database Sync] Running prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit' });

  console.log('[Database Sync] Running prisma db push...');
  execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' });

  console.log('[Database Sync] Running seed script...');
  require('../prisma/seed.js');
} catch (err) {
  console.warn('[Database Sync Warning] Could not complete full migration step:', err.message);
}
