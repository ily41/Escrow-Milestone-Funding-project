const path = require('path');
const Database = require('better-sqlite3');

// Resolve path to backend's db.sqlite3
const dbPath = path.resolve(__dirname, '../../backend/db.sqlite3');
console.log("DB Path:", dbPath);
const db = new Database(dbPath); // verbose: console.log to debug if needed

module.exports = {
    // Mimic pg.query interface: query(text, params) -> { rows: [], rowCount: n }
    async query(text, params = []) {
        // 1. Convert Postgres $1, $2... params to SQLite ?
        const sql = text.replace(/\$\d+/g, '?');

        // 2. Handle RETURNING clause (common in PG, not always simple in SQLite)
        // We strip 'RETURNING id' and use info.lastInsertRowid
        const hasReturning = /RETURNING\s+(\w+)/i.exec(sql);
        let cleanSql = sql;
        let returnField = null;

        if (hasReturning) {
            returnField = hasReturning[1];
            cleanSql = sql.replace(/RETURNING\s+[\w\(\)]+/i, ''); // Strip RETURNING id or RETURNING *
        }

        const isInsert = /^\s*INSERT/i.test(cleanSql);
        const isUpdate = /^\s*UPDATE/i.test(cleanSql);
        const isDelete = /^\s*DELETE/i.test(cleanSql);

        try {
            const stmt = db.prepare(cleanSql);

            if (!stmt.reader) {
                // INSERT, UPDATE, DELETE, CREATE, etc. (Writes)
                const info = stmt.run(...params);
                // Info: { changes: number, lastInsertRowid: number | bigint }

                let rows = [];
                if (hasReturning && isInsert) {
                    // Mock the return object
                    let row = {};
                    // If the return field is a column, map lastID to it?
                    // Assumes we are returning the primary key.
                    row[returnField] = info.lastInsertRowid;
                    rows.push(row);
                }

                return {
                    rowCount: info.changes,
                    rows: rows
                };
            } else {
                // SELECT (Reads)
                const rows = stmt.all(...params);
                return {
                    rowCount: rows.length,
                    rows: rows
                };
            }
        } catch (err) {
            // console.error("SQLite Error:", err.message, "Query:", cleanSql);
            throw err;
        }
    }
};
