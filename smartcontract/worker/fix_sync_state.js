const db = require('./db');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function fix() {
    try {
        const correctAddress = process.env.CONTRACT_ADDRESS.toLowerCase();
        console.log("Correct contract address:", correctAddress);

        // Update the sync_state to use the correct address
        await db.query("DELETE FROM sync_state");
        await db.query(
            "INSERT INTO sync_state (contract_address, last_processed_block, updated_at) VALUES ($1, 0, NOW())",
            [correctAddress]
        );

        console.log("Sync state updated successfully!");

        const res = await db.query("SELECT * FROM sync_state");
        console.log("New sync state:", res.rows);
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await db.close();
    }
}

fix();
