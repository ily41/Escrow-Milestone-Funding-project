const db = require('./db');
const { ethers } = require('ethers');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function checkSync() {
    try {
        // 1. Check Hardhat block height
        const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
        const currentBlock = await provider.getBlockNumber();
        console.log('Current Hardhat Block Number:', currentBlock);

        // 2. Check DB sync state
        const res = await db.query("SELECT * FROM sync_state");
        console.log('Sync State in DB:', res.rows);

        if (res.rows.length > 0) {
            const lastSynced = res.rows[0].last_processed_block;
            console.log(`Difference: ${currentBlock - lastSynced} blocks remaining`);
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await db.close();
    }
}

checkSync();
