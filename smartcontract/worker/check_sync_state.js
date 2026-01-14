const db = require('./db');

async function check() {
    try {
        const res = await db.query("SELECT * FROM sync_state");
        console.log('Sync State Entries:', res.rows);
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await db.close();
    }
}

check();
