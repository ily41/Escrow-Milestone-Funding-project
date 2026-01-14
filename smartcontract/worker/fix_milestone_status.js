const db = require('./db');

async function fix() {
    try {
        // Fix milestones that have status=3 but should be status=1 (Active)
        // Status 3 should only be for completed/released milestones
        const result = await db.query(`
            UPDATE milestones 
            SET status = 1 
            WHERE status = 3 AND is_activated = TRUE
        `);

        console.log(`Fixed ${result.rowCount} milestones from status=3 to status=1`);

        // Show current state
        const check = await db.query("SELECT milestone_id, title, status, is_activated FROM milestones");
        console.table(check.rows);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await db.close();
    }
}

fix();
