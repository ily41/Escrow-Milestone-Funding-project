const db = require('./db.js');

async function checkDb() {
    try {
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables:', tables.rows.map(r => r.table_name));

        for (const table of tables.rows) {
            const columns = await db.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [table.table_name]);
            console.log(`\nSchema for ${table.table_name}:`);
            columns.rows.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await db.close();
    }
}

checkDb();
