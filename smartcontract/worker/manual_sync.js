const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { ethers } = require("ethers");
const db = require("./db");
const { findUserByWallet } = require("./helpers");
const abi = require("../artifacts/contracts/ProjectEscrow.sol/ProjectEscrow.json").abi;

// Use the values from .env explicitly
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new ethers.Contract(contractAddress, abi, provider);

async function handlePledgeMade(event) {
    const [projectId, backerWallet, amountWei] = event.args;
    console.log(`Processing PledgeMade: project=${projectId}, backer=${backerWallet}, amount=${ethers.formatEther(amountWei)}`);

    const project_r = await db.query(
        `SELECT project_id FROM projects WHERE on_chain_id=$1`,
        [Number(projectId)]
    );
    if (project_r.rowCount === 0) {
        console.error("PledgeMade ERROR: project not found for onchain_id=" + projectId);
        return;
    }
    const project_db_id = project_r.rows[0].project_id;

    const backer_id = await findUserByWallet(backerWallet);
    if (!backer_id) {
        console.error("PledgeMade ERROR: Backer not found for wallet=" + backerWallet);
        return;
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
        console.log(`PledgeMade OK: updated project ${project_db_id}`);
    } catch (err) {
        console.error("Error updating DB:", err.message);
    }
}

async function main() {
    try {
        console.log("Starting manual sync...");
        const currentBlock = await provider.getBlockNumber();
        console.log("Current block:", currentBlock);

        const addr = contractAddress.toLowerCase();
        console.log("Searching sync state for:", addr);

        const res = await db.query("SELECT last_processed_block FROM sync_state WHERE contract_address = $1", [addr]);

        if (res.rowCount === 0) {
            console.error("No sync state found for contract:", addr);
            return;
        }

        const lastSynced = res.rows[0].last_processed_block;
        console.log(`Current Block: ${currentBlock}, Last Synced: ${lastSynced}`);
        console.log(`Syncing from ${lastSynced + 1} to ${currentBlock}`);

        const events = await contract.queryFilter("PledgeMade", lastSynced + 1, currentBlock);
        console.log(`Found ${events.length} PledgeMade events`);

        for (const event of events) {
            await handlePledgeMade(event);
        }

        await db.query("UPDATE sync_state SET last_processed_block = $1 WHERE contract_address = $2", [currentBlock, contract.target.toLowerCase()]);
        console.log("Sync complete!");

    } catch (err) {
        console.error("Sync failed:", err);
    } finally {
        await db.close();
    }
}

main();
