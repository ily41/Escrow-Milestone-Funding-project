const db = require('./db');

async function inspect() {
    try {
        const tables = ['projects', 'milestones', 'pledges'];
        for (const table of tables) {
            console.log(`--- Table: ${table} ---`);
            const columns = await db.query(
                "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1",
                [table]
            );
            console.log("Columns:", columns.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));

            const data = await db.query(`SELECT * FROM ${table} LIMIT 5`);
            console.log("Sample Data:", data.rows);
        }
    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await db.close();
    }
}

inspect();
