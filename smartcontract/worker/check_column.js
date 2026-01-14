const db = require('./db');
async function check() {
    try {
        const res = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'created_at'");
        if (res.rowCount > 0) {
            console.log("Column created_at EXISTS");
        } else {
            console.log("Column created_at DOES NOT EXIST");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await db.close();
    }
}
check();
