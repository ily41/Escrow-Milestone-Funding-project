const db = require('./db');

async function run() {
    try {
        console.log("Checking tables...");

        // Check backers column info
        const c_res = await db.query("SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'backers'");
        console.log("Backers columns:");
        console.table(c_res.rows);

        // Get IDs
        const projectId = '8d24bd0f-2879-4d6d-9e67-d86419ac378f';
        const backerWallet = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

        const b_res = await db.query("SELECT backer_id FROM backers WHERE LOWER(wallet_address) = $1", [backerWallet.toLowerCase()]);
        const backerId = b_res.rows[0].backer_id;
        console.log("BackerID:", backerId);

        // Try simple update on backer to see if it triggers error
        try {
            console.log("Attempting dummy update on backer...");
            await db.query("UPDATE backers SET status=1 WHERE backer_id=$1", [backerId]);
            console.log("Backer update OK");
        } catch (e) {
            console.error("Backer update FAILED:", e.message);
        }

        // Try Insert Pledge
        const txHash = '0xdff8a2b44248717c7a6dd739d56b8791028aec6bec379f2fce7f7ac2be5fd7ff';
        const amount = 2.0;

        try {
            console.log("Attempting INSERT pledge...");
            await db.query(`
                INSERT INTO pledges (project_id, backer_id, amount, status, transaction_hash, pledged_at)
                VALUES ($1, $2, $3, 1, $4, NOW())
            `, [projectId, backerId, amount, txHash]);
            console.log("Pledge insert OK");
        } catch (e) {
            console.error("Pledge insert FAILED:", e.message);
        }

    } catch (err) {
        console.error("General Error:", err);
    } finally {
        await db.close();
    }
}

run();
