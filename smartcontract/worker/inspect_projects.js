const db = require('./db');

async function check() {
    try {
        const res = await db.query("SELECT * FROM projects");
        console.log('Projects:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await db.close();
    }
}

check();
