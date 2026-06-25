const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const databaseUrl = process.env.DATABASE_URL || '';

if (databaseUrl.startsWith('postgres://') || databaseUrl.startsWith('postgresql://')) {
  console.log('Production database detected (PostgreSQL). Updating Prisma provider to postgresql...');
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, schema, 'utf8');
} else {
  console.log('Local/SQLite database detected. Ensuring Prisma provider is sqlite...');
  schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
  fs.writeFileSync(schemaPath, schema, 'utf8');
}
