const { ethers } = require('ethers');
const db = require('./db');
const { findUserByWallet } = require('./helpers');
const abi = require('../artifacts/contracts/ProjectEscrow.sol/ProjectEscrow.json').abi;
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new ethers.Contract(contractAddress, abi, provider);

async function handlePledgeMade(event) {
    const [projectId, backerWallet, amountWei] = event.args;
    console.log(`Processing PledgeMade: project=${projectId}, backer=${backerWallet}, amount=${ethers.formatEther(amountWei)}`);

    const project_r = await db.query(
        `SELECT project_id, total_pledged FROM projects WHERE on_chain_id=$1`,
        [Number(projectId)]
    );
    if (project_r.rowCount === 0) {
        console.error("PledgeMade ERROR: project not found for onchain_id=" + projectId);
        return;
    }
    const project_data = project_r.rows[0];
    const project_db_id = project_data.project_id;
    console.log(`Current total_pledged: ${project_data.total_pledged}`);

    let backer_id = await findUserByWallet(backerWallet);
    if (!backer_id) {
        console.error("Backer not found via helper. Checking directly...");
        const b_res = await db.query("SELECT backer_id FROM backers WHERE LOWER(wallet_address)=$1", [backerWallet.toLowerCase()]);
        if (b_res.rowCount > 0) {
            backer_id = b_res.rows[0].backer_id;
            console.log("Found backer directly:", backer_id);
        } else {
            console.error("Backer definitely not found for wallet=" + backerWallet);
            return;
        }
    }

    const amount = Number(ethers.formatEther(amountWei));

    const existing = await db.query(
        `SELECT pledge_id FROM pledges WHERE transaction_hash=$1`,
        [event.transactionHash]
    );
    if (existing.rowCount > 0) {
        console.log("PledgeMade SKIPPED: Already indexed tx=" + event.transactionHash);
        return;
    }

    try {
        await db.query(
            `INSERT INTO pledges (project_id, backer_id, amount, status, transaction_hash, pledged_at)
             VALUES ($1, $2, $3, 1, $4, NOW())`,
            [project_db_id, backer_id, amount, event.transactionHash]
        );

        await db.query(
            `UPDATE projects SET total_pledged = total_pledged + $1 WHERE project_id = $2`,
            [amount, project_db_id]
        );
        console.log(`PledgeMade OK: updated project ${project_db_id}, added ${amount} ETH`);

        // Verify final amount
        const final_r = await db.query("SELECT total_pledged FROM projects WHERE project_id=$1", [project_db_id]);
        console.log(`New total_pledged: ${final_r.rows[0].total_pledged}`);

    } catch (err) {
        console.error("Error updating DB:", err.message);
    }
}

async function main() {
    try {
        const blockNum = 56;
        console.log(`Force syncing block ${blockNum}`);

        const events = await contract.queryFilter("PledgeMade", blockNum, blockNum);
        console.log(`Found ${events.length} PledgeMade events`);

        for (const event of events) {
            await handlePledgeMade(event);
        }

    } catch (err) {
        console.error("Sync failed:", err);
    } finally {
        await db.close();
    }
}

main();
