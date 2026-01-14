const db = require('./db');

async function check() {
    try {
        const res = await db.query("SELECT milestone_id, title, status, on_chain_id, is_activated FROM milestones ORDER BY milestone_id");
        console.log('Current Milestones:');
        console.table(res.rows);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await db.close();
    }
}

check();
