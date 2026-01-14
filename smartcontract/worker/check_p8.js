
const db = require('./db');
async function main() {
    try {
        const p = await db.query('SELECT project_id, title FROM projects WHERE on_chain_id = 8');
        if (p.rowCount === 0) {
            console.log('Project 8 not found');
            return;
        }
        const p_id = p.rows[0].project_id;
        console.log('Project:', p.rows[0].title, p_id);
        const m = await db.query('SELECT title, on_chain_id, status, is_activated FROM milestones WHERE project_id = $1 ORDER BY on_chain_id', [p_id]);
        console.log('Milestones:', m.rows);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
}
main();
