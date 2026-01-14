const { Client } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'smartcontract/worker/.env') });

async function checkSync() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    await client.connect();
    try {
        const res = await client.query('SELECT * FROM sync_state');
        console.log('Sync State:', res.rows);

        // Also check total_pledged for projects
        const projects = await client.query('SELECT project_id, title, total_pledged, funding_goal, on_chain_id FROM projects');
        console.log('Projects:', projects.rows);

        // Check pledges
        const pledges = await client.query('SELECT project_id, amount, transaction_hash FROM pledges');
        console.log('Pledges Table Count:', pledges.rowCount);
    } finally {
        await client.end();
    }
}

checkSync().catch(console.error);
