const db = require('./db');

async function reset() {
    try {
        await db.query("UPDATE sync_state SET last_processed_block = 55 WHERE contract_address = '0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f'");
        console.log("Reset last_processed_block to 55");
    } catch (err) {
        console.error(err);
    } finally {
        await db.close();
    }
}

reset();
