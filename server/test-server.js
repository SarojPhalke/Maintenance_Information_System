// Quick test script to verify server setup
import dotenv from 'dotenv';
import sql from './db.js';

dotenv.config();

console.log('🔍 Testing Server Configuration...\n');

// Test 1: Environment Variables
console.log('1. Checking Environment Variables:');
console.log(`   DB_HOST: ${process.env.DB_HOST || 'NOT SET'}`);
console.log(`   DB_PORT: ${process.env.DB_PORT || 'NOT SET'}`);
console.log(`   DB_NAME: ${process.env.DB_NAME || 'NOT SET'}`);
console.log(`   DB_USER: ${process.env.DB_USER || 'NOT SET'}`);
console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? 'SET' : 'NOT SET'}`);
console.log(`   PORT: ${process.env.PORT || '3000 (default)'}\n`);

// Test 2: Database Connection
console.log('2. Testing Database Connection...');
try {
  const result = await sql`SELECT 1 as test, current_database() as db_name, version() as pg_version`;
  console.log('   ✅ Database connection successful!');
  console.log(`   Database: ${result[0].db_name}`);
  console.log(`   PostgreSQL: ${result[0].pg_version.split(',')[0]}\n`);
} catch (err) {
  console.error('   ❌ Database connection failed!');
  console.error(`   Error: ${err.message}\n`);
  process.exit(1);
}

// Test 3: Check if tables exist
console.log('3. Checking Required Tables...');
const tables = [
  'asset_master',
  'bd_entry_operator',
  'bd_entry_engineer',
  'spare_parts_inventory',
  'spare_transactions',
  'pm_schedule',
  'utility_logs',
  'users'
];

for (const table of tables) {
  try {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = ${table}
      ) as exists;
    `;
    if (result[0].exists) {
      console.log(`   ✅ ${table} exists`);
    } else {
      console.log(`   ⚠️  ${table} does NOT exist`);
    }
  } catch (err) {
    console.log(`   ❌ Error checking ${table}: ${err.message}`);
  }
}

console.log('\n✅ Server configuration test complete!');
console.log('   If all checks pass, you can start the server with: npm run dev\n');

process.exit(0);

