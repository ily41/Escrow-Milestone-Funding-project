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

        if (syncRes.rows.length > 0) {
            const lastSynced = syncRes.rows[0].last_processed_block;
            const behind = currentBlock - lastSynced;
            console.log(`Indexer is ${behind} blocks behind`);

            if (behind > 0) {
                console.log('WARNING: Indexer is not keeping up!');
            } else {
                console.log('OK: Indexer is up to date');
            }
        }

        // Check recent pledges
        const pledges = await db.query("SELECT * FROM pledges ORDER BY pledged_at DESC LIMIT 5");
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
