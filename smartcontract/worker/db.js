const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

module.exports = {
    async query(text, params) {
        const start = Date.now();
        try {
            const res = await pool.query(text, params);
            const duration = Date.now() - start;
            // console.log('Executed query', { text, duration, rows: res.rowCount });
            return res;
        } catch (err) {
            console.error('Database query error:', err.message);
            throw err;
        }
    },
    async close() {
        await pool.end();
    }
};
