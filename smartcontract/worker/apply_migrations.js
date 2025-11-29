const path = require("path");
const fs = require("fs");
const envPath = path.join(__dirname, "../.env");
console.log("Loading .env from:", envPath);
console.log("File exists:", fs.existsSync(envPath));
require("dotenv").config({ path: envPath });
const { Client } = require("pg");

const MIGRATIONS_DIR = path.join(__dirname, "../db/migrations");

async function applyMigrations() {
    console.log("Starting migration process...");

    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL is not set in .env");
        process.exit(1);
    }

    // 1. Create Database if it doesn't exist
    try {
        const url = new URL(process.env.DATABASE_URL);
        const targetDb = url.pathname.slice(1);
        url.pathname = "/postgres"; // Connect to default 'postgres' db

        const client = new Client({ connectionString: url.toString() });
        await client.connect();

        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [targetDb]);
        if (res.rowCount === 0) {
            console.log(`Creating database '${targetDb}'...`);
            await client.query(`CREATE DATABASE "${targetDb}"`);
        } else {
            console.log(`Database '${targetDb}' already exists.`);
        }
        await client.end();
    } catch (err) {
        console.error("Warning: Could not check/create database. Assuming it exists or connection will fail.", err.message);
    }

    // 2. Connect to the target database
    const db = new Client({ connectionString: process.env.DATABASE_URL });
    try {
        await db.connect();
    } catch (err) {
        console.error("Failed to connect to target database:", err.message);
        process.exit(1);
    }

    // 3. Create migrations table
    await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

    const files = fs.readdirSync(MIGRATIONS_DIR).sort();

    for (const file of files) {
        if (!file.endsWith(".sql")) continue;

        const version = file.split("__")[0];

        const res = await db.query("SELECT 1 FROM schema_migrations WHERE version = $1", [version]);
        if (res.rowCount > 0) {
            console.log(`Skipping ${file} (already applied)`);
            continue;
        }

        console.log(`Applying ${file}...`);
        const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");

        try {
            await db.query("BEGIN");
            await db.query(sql);
            await db.query("INSERT INTO schema_migrations (version) VALUES ($1)", [version]);
            await db.query("COMMIT");
            console.log(`Applied ${file}`);
        } catch (err) {
            await db.query("ROLLBACK");
            console.error(`Failed to apply ${file}:`, err);
            process.exit(1);
        }
    }

    console.log("All migrations applied successfully.");
    await db.end();
    process.exit(0);
}

applyMigrations();
