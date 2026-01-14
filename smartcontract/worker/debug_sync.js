const db = require('./db');

async function check() {
    try {
        const onChainId = 1;
        const res = await db.query(
            "SELECT project_id, total_pledged, funding_goal, progress_percentage FROM projects WHERE on_chain_id = $1",
            [onChainId]
        );
        console.log('Project 1 Funding Data:', res.rows[0]);

        if (res.rows[0]) {
            const internalId = res.rows[0].project_id;
            const res2 = await db.query(
                "SELECT SUM(amount) as total_from_pledges FROM pledges WHERE project_id = $1",
                [internalId]
            );
            console.log('Total from Pledges Table:', res2.rows[0]);

            const res3 = await db.query(
                "SELECT * FROM pledges WHERE project_id = $1",
                [internalId]
            );
            console.log('Pledge Details:', res3.rows);
        }
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await db.close();
    }
}

check();
