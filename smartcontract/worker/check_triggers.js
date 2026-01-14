const db = require('./db');

async function check() {
    try {
        const res = await db.query(`
            SELECT event_object_table, trigger_name, action_statement 
            FROM information_schema.triggers 
            WHERE event_object_table = 'pledges'
        `);
        console.log('Triggers on pledges table:');
        console.table(res.rows);

        const res2 = await db.query(`
            SELECT event_object_table, trigger_name, action_statement 
            FROM information_schema.triggers 
            WHERE event_object_table = 'backers'
        `);
        console.log('Triggers on backers table:');
        console.table(res2.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await db.close();
    }
}

check();
