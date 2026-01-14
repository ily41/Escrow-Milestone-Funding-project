const db = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'add_is_activated.sql'), 'utf8');
        console.log('Running migration...');
        console.log(sql);

        await db.query(sql);
        console.log('Migration completed successfully!');

        // Verify
        const result = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'milestones' AND column_name = 'is_activated'");
        console.log('Verification:', result.rows.length > 0 ? 'Column exists' : 'Column not found');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await db.close();
    }
}

runMigration();
