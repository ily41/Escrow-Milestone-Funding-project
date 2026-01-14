const { ethers } = require('ethers');
const db = require('./db');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function check() {
    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const currentBlock = await provider.getBlockNumber();
        console.log('Current blockchain block:', currentBlock);

        const syncRes = await db.query("SELECT * FROM sync_state");
        console.log('Sync state:', syncRes.rows);

        // Update sync state to current block to skip old blocks
        if (syncRes.rows.length > 0) {
            await db.query("UPDATE sync_state SET last_processed_block = $1 WHERE contract_address = $2",
                [currentBlock, syncRes.rows[0].contract_address]);
            console.log(`Updated sync state to block ${currentBlock}`);
        }

        // Check recent pledges
        const pledges = await db.query("SELECT pledge_id, amount, pledged_at, transaction_hash FROM pledges ORDER BY pledged_at DESC LIMIT 5");
        console.log('\nRecent pledges:');
        console.table(pledges.rows);

        // Check project funding
        const projects = await db.query("SELECT project_id, title, total_pledged, funding_goal FROM projects WHERE on_chain_id = 1");
        console.log('\nProject 1 funding:');
        console.table(projects.rows);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await db.close();
    }
}

check();
