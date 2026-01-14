const db = require('./db');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function check() {
    try {
        const r1 = await db.query("SELECT * FROM sync_state");
        if (r1.rowCount === 0) {
            console.log("No sync state.");
            return;
        }
        const state1 = r1.rows[0];
        console.log(`State 1: Block ${state1.last_processed_block} at ${state1.updated_at}`);

        await sleep(3000);

        const r2 = await db.query("SELECT * FROM sync_state");
        const state2 = r2.rows[0];
        console.log(`State 2: Block ${state2.last_processed_block} at ${state2.updated_at}`);

        if (state1.last_processed_block === state2.last_processed_block &&
            state1.updated_at.getTime() === state2.updated_at.getTime()) {
            console.log("Indexer seems STALLED or DEAD.");
        } else {
            console.log("Indexer is RUNNING.");
        }

    } catch (err) {
        console.error(err);
    } finally {
        await db.close();
    }
}
check();
