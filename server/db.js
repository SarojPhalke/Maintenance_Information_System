// OPTION 2: Using Supabase connection pool
// import dotenv from "dotenv";
// import pkg from "pg";

// dotenv.config();

// const { Pool } = pkg;

// // Read environment variables
// const USER = process.env.DB_USER;
// const PASSWORD = process.env.DB_PASSWORD;
// const HOST = process.env.DB_HOST;
// const PORT = process.env.DB_PORT;
// const DBNAME = process.env.DB_NAME;

// // Create PostgreSQL connection pool
// const pool = new Pool({
//   user: USER,
//   password: PASSWORD,
//   host: HOST,
//   port: PORT,
//   database: DBNAME,
//   ssl: {
//     rejectUnauthorized: false, // REQUIRED for Supabase
//   },
// });

// // Test the connection
// (async () => {
//   try {
//     const client = await pool.connect();
//     console.log("✅ Connection successful!");
//     client.release();
//   } catch (error) {
//     console.error("❌ Failed to connect:", error.message);
//   }
// })();

// export default pool;

//Option 1: Using PostgreSQL connection pool
import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config()

// For Supabase, the connection string should come from 'DATABASE_URL' env variable.
// Supabase recommends using SSL with rejectUnauthorized: false.
// See: https://supabase.com/docs/guides/database/connecting-to-postgres#nodejs

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.warn('⚠️  DATABASE_URL not set in environment variables. Add it to your .env file (see Supabase Project > Settings > Database > Connection string).')
}

// Initialize Postgres client with recommended options for Supabase
const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
  family: 4   // 👈 FORCE IPv4
})

export default sql