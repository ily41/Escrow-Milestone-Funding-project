const db = require('./db');
const { v4: uuidv4 } = require('uuid');

async function fix() {
    try {
        const backerWallet = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';

        // Check if backer exists
        const check = await db.query("SELECT * FROM backers WHERE LOWER(wallet_address) = $1", [backerWallet.toLowerCase()]);

        if (check.rowCount === 0) {
            console.log('Backer not found, creating...');
            const backerId = uuidv4();
            const result = await db.query(
                `INSERT INTO backers (backer_id, wallet_address, status, total_pledged, registered_at) 
                 VALUES ($1, $2, 1, 0, NOW()) RETURNING *`,
                [backerId, backerWallet.toLowerCase()]
            );
            console.log('Backer created:', result.rows[0]);
        } else {
            console.log('Backer already exists:', check.rows[0]);
        }

    } catch (err) {
        console.error('Full error:', err);
    } finally {
        await db.close();
    }
}

fix();
