const db = require('./db');

async function check() {
    try {
        const res = await db.query("SELECT * FROM pledges");
        console.log('Pledges:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await db.close();
    }
}

check();
