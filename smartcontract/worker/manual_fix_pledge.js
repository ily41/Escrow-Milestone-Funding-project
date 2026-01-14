const db = require('./db');

async function run() {
    try {
        // 1. Get Project ID
        const p_res = await db.query("SELECT project_id, total_pledged FROM projects WHERE on_chain_id = 1");
        if (p_res.rowCount === 0) throw new Error("Project 1 not found");
        const projectId = p_res.rows[0].project_id;
        console.log(`Project ID: ${projectId}, Current Pledged: ${p_res.rows[0].total_pledged}`);

        // 2. Get Backer ID
        const b_res = await db.query("SELECT backer_id FROM backers WHERE LOWER(wallet_address) = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266'");
        if (b_res.rowCount === 0) throw new Error("Backer not found");
        const backerId = b_res.rows[0].backer_id;
        console.log(`Backer ID: ${backerId}`);

        // 3. Insert Pledge (Transaction: 0xdff8a2b44248717c7a6dd739d56b8791028aec6bec379f2fce7f7ac2be5fd7ff)
        const txHash = '0xdff8a2b44248717c7a6dd739d56b8791028aec6bec379f2fce7f7ac2be5fd7ff';

        // Check existence
        const check = await db.query("SELECT pledge_id FROM pledges WHERE transaction_hash = $1", [txHash]);
        if (check.rowCount > 0) {
            console.log("Pledge already exists!");
            return;
        }

        const amount = 2.0;

        console.log("Inserting pledge...");
        await db.query(`
            INSERT INTO pledges (project_id, backer_id, amount, status, transaction_hash, pledged_at)
            VALUES ($1, $2, $3, 1, $4, NOW())
        `, [projectId, backerId, amount, txHash]);
        console.log("Pledge inserted!");

        // 4. Update Project Funding
        console.log("Updating project funding...");
        await db.query(`
            UPDATE projects 
            SET total_pledged = total_pledged + $1 
            WHERE project_id = $2
        `, [amount, projectId]);

        // 5. Verify
        const final_p = await db.query("SELECT total_pledged FROM projects WHERE project_id = $1", [projectId]);
        console.log(`New total_pledged: ${final_p.rows[0].total_pledged}`);

    } catch (err) {
        console.error("Error:", err.message);
        console.error(err);
    } finally {
        await db.close();
    }
}

run();
