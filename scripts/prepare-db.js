const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const dbUrl = process.env.DATABASE_URL || 'file:./dev.db';
const isPostgres = dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://');

console.log(`[Database Sync] Detected database URL protocol: ${isPostgres ? 'PostgreSQL (Cloud)' : 'SQLite (Local)'}`);

// Update datasource provider in schema.prisma dynamically
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
