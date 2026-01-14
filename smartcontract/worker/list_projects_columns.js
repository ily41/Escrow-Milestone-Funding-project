const db = require('./db');
async function check() {
    try {
        const res = await db.query("SELECT column_name, is_nullable, data_type, column_default FROM information_schema.columns WHERE table_name = 'projects'");
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await db.close();
    }
}
check();
