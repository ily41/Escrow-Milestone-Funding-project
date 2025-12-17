const db = require('./db');
const path = require('path');

(async () => {
    try {
        console.log("DB Path should be:", path.resolve(__dirname, '../../backend/db.sqlite3'));

        console.log("Verifying sync_state table logic...");
        await db.query(`
            CREATE TABLE IF NOT EXISTS sync_state (
                contract_address TEXT PRIMARY KEY,
                last_processed_block INTEGER DEFAULT 0,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("Table creation query executed.");

        // Check schema
        const res = await db.query("SELECT sql FROM sqlite_master WHERE type='table' AND name='sync_state'");
        if (res.rows && res.rows.length > 0) {
            console.log("SUCCESS: sync_state table schema:");
            console.log(res.rows[0].sql);
        } else {
            if (res.rowCount > 0 && res.rows.length > 0) {
                console.log("SUCCESS (rowCount+rows): sync_state table schema:");
                console.log(res.rows[0].sql);
            } else {
                console.error("FAILURE: sync_state table not found after creation.");
                console.log("Rows:", res.rows);
            }
        }
    } catch (err) {
        console.error("ERROR executing verification:", err);
    }
})();
