const db = require('./db');

async function run() {
    try {
        const projectId = '8d24bd0f-2879-4d6d-9e67-d86419ac378f';
        const amount = 2.0;

        console.log("Updating project funding...");
        await db.query(`
            UPDATE projects 
            SET total_pledged = total_pledged + $1 
            WHERE project_id = $2
        `, [amount, projectId]);
        console.log("Project update OK");

        const final_p = await db.query("SELECT total_pledged FROM projects WHERE project_id = $1", [projectId]);
        console.log(`New total_pledged: ${final_p.rows[0].total_pledged}`);

    } catch (err) {
        console.error("Project update FAILED:", err.message);
    } finally {
        await db.close();
    }
}

run();
