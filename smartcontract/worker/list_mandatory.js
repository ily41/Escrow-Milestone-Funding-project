const db = require('./db');
async function check() {
    try {
        const res = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects' AND is_nullable = 'NO' AND column_default IS NULL");
        console.log("MANDATORY COLUMNS (No Default):");
        res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));
    } catch (err) {
        console.error(err);
    } finally {
        await db.close();
    }
}
check();
