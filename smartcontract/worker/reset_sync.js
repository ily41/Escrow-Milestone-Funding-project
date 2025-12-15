const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const db = require("./db");
const { contract } = require("./eth");

async function main() {
    console.log("Resetting sync state for contract:", contract.target);
    try {
        // Create table if not exists (SQLite)
        await db.query(`
      CREATE TABLE IF NOT EXISTS sync_state (
        contract_address TEXT PRIMARY KEY,
        last_processed_block INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // Reset block to 0
        await db.query(
            "UPDATE sync_state SET last_processed_block = 0 WHERE contract_address = $1",
            [contract.target.toLowerCase()]
        );

        // If no row updated (table was empty), insert one
        const res = await db.query("SELECT * FROM sync_state WHERE contract_address = $1", [contract.target.toLowerCase()]);
        if (res.rowCount === 0) {
            await db.query(
                "INSERT INTO sync_state (contract_address, last_processed_block) VALUES ($1, 0)",
                [contract.target.toLowerCase()]
            );
        }

        console.log("Sync state reset to 0.");
    } catch (err) {
        console.error("Error resetting sync state:", err);
    }
}

main();
