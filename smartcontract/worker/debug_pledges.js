const db = require('./db');

async function check() {
    try {
        const onChainId = 0;
        const res = await db.query(
            "SELECT project_id, total_pledged, funding_goal FROM projects WHERE on_chain_id = $1",
            [onChainId]
        );
        console.log('Project 1 Data:', res.rows[0]);

        if (res.rows[0]) {
            const internalId = res.rows[0].project_id;
            const res2 = await db.query(
                "SELECT pledge_id, amount, transaction_hash, status, pledged_at FROM pledges WHERE project_id = $1",
                [internalId]
            );
            console.log('Pledges for Project 1:', res2.rows);

            const totalFromPledges = res2.rows.reduce((sum, p) => sum + parseFloat(p.amount), 0);
            console.log('Calculated Total from Pledges Table:', totalFromPledges);
        }
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await db.close();
    }
}

check();
