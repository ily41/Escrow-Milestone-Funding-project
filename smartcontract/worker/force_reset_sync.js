const db = require('./db');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function reset() {
    try {
        const address = process.env.CONTRACT_ADDRESS;
        await db.query("DELETE FROM sync_state");
        await db.query("INSERT INTO sync_state (contract_address, last_processed_block) VALUES ($1, 55)", [address.toLowerCase()]);
        console.log(`Reset sync_state for ${address} to block 55`);
    } catch (err) {
        console.error(err);
    } finally {
        await db.close();
    }
}

reset();
