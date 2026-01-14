const db = require('./db');

async function checkProject() {
    try {
        const projectId = 1;
        console.log(`Checking DB for Project ID: ${projectId}`);

        const projectRes = await db.query(
            "SELECT project_id, on_chain_id, total_pledged, funding_goal, status FROM projects WHERE project_id = $1 OR on_chain_id = $2",
            [projectId, projectId]
        );
        console.log("Project in DB:", projectRes.rows);

        const internalId = projectRes.rows[0]?.project_id;
        if (internalId) {
            const pledgeRes = await db.query(
                "SELECT pledge_id, amount, status, transaction_hash FROM pledges WHERE project_id = $1",
                [internalId]
            );
            console.log("Pledges in DB:", pledgeRes.rows);

            const milestoneRes = await db.query(
                "SELECT milestone_id, on_chain_id, title, status, is_activated FROM milestones WHERE project_id = $1",
                [internalId]
            );
            console.log("Milestones in DB:", milestoneRes.rows);
        }

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await db.close();
    }
}

checkProject();
