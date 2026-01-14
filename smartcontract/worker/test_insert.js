const db = require('./db');
const { v4: uuidv4 } = require('uuid');

async function run() {
    try {
        console.log("Testing Insert...");
        const pid = uuidv4();
        const address = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

        await db.query(`
            INSERT INTO projects (project_id, title, funding_goal, creator_address, status, escrow_address, deadline, total_pledged)
            VALUES ($1, 'Test Project', 10, $2, 'active', '0x0000000000000000000000000000000000000000', NOW(), 0)
        `, [pid, address]);

        console.log("Insert Success!");

        // Clean up
        // await db.query("DELETE FROM projects WHERE project_id = $1", [pid]);
    } catch (err) {
        console.error("Insert Failed:");
        console.error("Message:", err.message);
        console.error("Column:", err.column);
        console.error("Detail:", err.detail);
        console.error("Code:", err.code);
    } finally {
        await db.close();
    }
}

run();
