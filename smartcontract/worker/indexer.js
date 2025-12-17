const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const db = require("./db");
const { contract, ethers } = require("./eth");
const { findUserByWallet } = require("./helpers");
const fs = require("fs");

const LOG = (msg) =>
  fs.appendFileSync(__dirname + "/indexer.log", `[${new Date().toISOString()}] ${msg}\n`);

const POLLING_INTERVAL = 5000; // 5 seconds
const CONFIRMATIONS = 1; // Lowered for local dev speed
const CHUNK_SIZE = 1000;

async function getLastSyncedBlock() {
  try {
    const res = await db.query(
      "SELECT last_processed_block FROM sync_state WHERE contract_address = $1",
      [contract.target.toLowerCase()]
    );
    if (res.rowCount === 0) {
      await db.query(
        "INSERT INTO sync_state (contract_address, last_processed_block, updated_at) VALUES ($1, 0, datetime('now'))",
        [contract.target.toLowerCase()]
      );
      return 0;
    }
    return res.rows[0].last_processed_block;
  } catch (err) {
    console.error("Error getting last synced block (ensure sync_state table exists):", err);
    return 0;
  }
}

async function updateLastSyncedBlock(blockNumber) {
  await db.query(
    "UPDATE sync_state SET last_processed_block = $1 WHERE contract_address = $2",
    [blockNumber, contract.target.toLowerCase()]
  );
}

async function handleProjectCreated(event) {
  const [projectId, creator, fundingGoal, deadline] = event.args;
  console.log("Processing ProjectCreated", projectId);

  const onchainId = Number(projectId);

  // Just logging for now as API handles the link.
  LOG(`Indexed ProjectCreated → onchainId=${onchainId}`);
}

async function handlePledgeMade(event) {
  const [projectId, backerWallet, amountWei] = event.args;

  // Find project in Django table
  const project_r = await db.query(
    `SELECT id FROM projects_project WHERE onchain_project_id=$1`,
    [Number(projectId)]
  );
  if (project_r.rowCount === 0) {
    LOG("PledgeMade ERROR: project not found for onchain_id=" + projectId);
    return;
  }
  const project_db_id = project_r.rows[0].id;

  // Find backer in Django table
  const backer_id = await findUserByWallet(backerWallet);
  if (!backer_id) {
    LOG("PledgeMade ERROR: Backer not found for wallet=" + backerWallet);
    return;
  }

  const amount = Number(ethers.formatEther(amountWei));

  // Check if pledge already exists (idempotency)
  const existing = await db.query(
    `SELECT id FROM finance_pledge WHERE payment_reference=$1`,
    [event.transactionHash]
  );
  if (existing.rowCount > 0) {
    LOG("PledgeMade SKIPPED: Already indexed tx=" + event.transactionHash);
    return;
  }

  // Insert pledge into finance_pledge
  // status='active' (Django uses 'active', 'refunded', 'cancelled')
  try {
    const res = await db.query(
      `INSERT INTO finance_pledge (project_id, backer_id, amount, currency, status, payment_reference, created_at)
        VALUES ($1, $2, $3, 'ETH', 'active', $4, datetime('now'))
        RETURNING id`,
      [project_db_id, backer_id, amount, event.transactionHash]
    );
    // const pledge_id = res.rows[0].id; // Unused

    LOG(`PledgeMade OK: project_id=${project_db_id}, amount=${amount}`);
  } catch (err) {
    console.error("Error inserting pledge:", err);
    throw err;
  }
}

async function handleMilestoneSubmitted(event) {
  const [projectId, milestoneId, description, amountWei] = event.args;

  const project_r = await db.query(
    `SELECT id FROM projects_project WHERE onchain_project_id=$1`,
    [Number(projectId)]
  );
  if (project_r.rowCount === 0) return;
  const project_db_id = project_r.rows[0].id;

  const ms_r = await db.query(
    `SELECT id FROM projects_milestone WHERE project_id=$1 AND onchain_milestone_id=$2`,
    [project_db_id, Number(milestoneId)]
  );

  if (ms_r.rowCount === 0) {
    LOG(`MilestoneSubmitted: No matching milestone found yet for onchain_id=${milestoneId}`);
  } else {
    LOG(`MilestoneSubmitted OK: Found milestone ${ms_r.rows[0].id}`);
  }
}

async function handleFundsReleased(event) {
  const [projectId, milestoneId, amountWei] = event.args;

  const project_r = await db.query(
    `SELECT id FROM projects_project WHERE onchain_project_id=$1`,
    [Number(projectId)]
  );
  if (project_r.rowCount === 0) return;
  const project_db_id = project_r.rows[0].id;

  const ms_r = await db.query(
    `SELECT id FROM projects_milestone WHERE project_id=$1 AND onchain_milestone_id=$2`,
    [project_db_id, Number(milestoneId)]
  );
  if (ms_r.rowCount === 0) return;
  const milestone_db_id = ms_r.rows[0].id;

  // Check idempotency via tx_reference
  const existingRelease = await db.query(`SELECT id FROM finance_release WHERE tx_reference=$1`, [event.transactionHash]);
  if (existingRelease.rowCount > 0) {
    LOG("FundsReleased SKIPPED: Already indexed tx=" + event.transactionHash);
    return;
  }

  const amount = Number(ethers.formatEther(amountWei));

  // Find creator
  const creator_r = await db.query(`SELECT creator_id FROM projects_project WHERE id=$1`, [project_db_id]);
  const creator_id = creator_r.rows[0].creator_id;

  // Find or Create Wallet for Creator
  let wallet_id;
  const w_r = await db.query(`SELECT id FROM finance_wallet WHERE owner_type='creator' AND owner_id=$1`, [creator_id]);
  if (w_r.rowCount > 0) {
    wallet_id = w_r.rows[0].id;
  } else {
    const w_ins = await db.query(
      `INSERT INTO finance_wallet (owner_type, owner_id, balance, currency, created_at)
           VALUES ('creator', $1, 0, 'USD', datetime('now')) RETURNING id`,
      [creator_id]
    );
    wallet_id = w_ins.rows[0].id;
  }

  // Insert release
  await db.query(
    `INSERT INTO finance_release (milestone_id, amount_released, released_to_wallet_id, released_at, tx_reference)
       VALUES ($1, $2, $3, datetime('now'), $4)`,
    [milestone_db_id, amount, wallet_id, event.transactionHash]
  );

  // Update milestone status to 'paid'
  await db.query(
    `UPDATE projects_milestone SET status='paid' WHERE id=$1`,
    [milestone_db_id]
  );
  LOG(`FundsReleased OK: amount=${amount}`);
}

async function handleRefundIssued(event) {
  const [projectId, backerWallet, amountWei] = event.args;

  const project_r = await db.query(
    `SELECT id FROM projects_project WHERE onchain_project_id=$1`,
    [Number(projectId)]
  );
  if (project_r.rowCount === 0) return;
  const project_db_id = project_r.rows[0].id;

  const backer_id = await findUserByWallet(backerWallet);
  if (!backer_id) return;

  const amount = Number(ethers.formatEther(amountWei));

  // Find pledge - check if already refunded to prevent duplicate
  const pledgeRes = await db.query(
    `SELECT id, status FROM finance_pledge WHERE project_id=$1 AND backer_id=$2 AND status='active' LIMIT 1`,
    [project_db_id, backer_id]
  );

  if (pledgeRes.rowCount > 0) {
    const pledge_id = pledgeRes.rows[0].id;

    // Insert refund
    await db.query(
      `INSERT INTO finance_refund (pledge_id, amount, reason, status, created_at)
             VALUES ($1, $2, 'On-chain refund', 'processed', datetime('now'))`,
      [pledge_id, amount]
    );

    // Update pledge status
    await db.query(`UPDATE finance_pledge SET status='refunded' WHERE id=$1`, [pledge_id]);

    LOG(`RefundIssued OK: amount=${amount}`);
  } else {
    LOG("RefundIssued SKIPPED: No active pledge found or already refunded.");
  }
}

async function handleVotingStarted(event) {
  const [projectId, milestoneId] = event.args;

  const project_r = await db.query(
    `SELECT id FROM projects_project WHERE onchain_project_id=$1`,
    [Number(projectId)]
  );
  if (project_r.rowCount === 0) return;
  const project_db_id = project_r.rows[0].id;

  const ms_r = await db.query(
    `SELECT id FROM projects_milestone WHERE project_id=$1 AND onchain_milestone_id=$2`,
    [project_db_id, Number(milestoneId)]
  );
  if (ms_r.rowCount === 0) return;
  const milestone_db_id = ms_r.rows[0].id;

  await db.query(`UPDATE projects_milestone SET status='voting' WHERE id=$1`, [milestone_db_id]);

  LOG(`VotingStarted OK: Updated milestone ${milestone_db_id} to 'voting'`);
}

async function processEvent(event) {
  const { transactionHash, logIndex } = event;
  try {
    if (event.eventName === "ProjectCreated") {
      await handleProjectCreated(event);
    } else if (event.eventName === "PledgeMade") {
      await handlePledgeMade(event);
    } else if (event.eventName === "MilestoneSubmitted") {
      await handleMilestoneSubmitted(event);
    } else if (event.eventName === "FundsReleased") {
      await handleFundsReleased(event);
    } else if (event.eventName === "RefundIssued") {
      await handleRefundIssued(event);
    } else if (event.eventName === "VotingStarted") {
      await handleVotingStarted(event);
    }
  } catch (err) {
    console.error(`Error processing event ${event.eventName} at ${transactionHash}:`, err);
    LOG(`ERROR ${event.eventName}: ${err.message}`);
  }
}

async function main() {
  console.log("Indexer started (Django Compatible Mode).");
  LOG("Indexer booted.");

  // Ensure sync_state table exists
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS sync_state (
        contract_address TEXT PRIMARY KEY,
        last_processed_block INTEGER DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.error("Failed to ensure sync_state table exists:", err);
  }

  while (true) {
    try {
      const currentBlock = await contract.runner.provider.getBlockNumber();
      const lastSynced = await getLastSyncedBlock();
      const safeBlock = currentBlock - CONFIRMATIONS;

      if (lastSynced >= safeBlock) {
        await new Promise((r) => setTimeout(r, POLLING_INTERVAL));
        continue;
      }

      const toBlock = Math.min(lastSynced + CHUNK_SIZE, safeBlock);
      console.log(`Syncing blocks ${lastSynced + 1} to ${toBlock}...`);

      const events = await contract.queryFilter("*", lastSynced + 1, toBlock);

      for (const event of events) {
        await processEvent(event);
      }

      await updateLastSyncedBlock(toBlock);

    } catch (err) {
      console.error("Polling loop error:", err);
      // await new Promise((r) => setTimeout(r, POLLING_INTERVAL)); // Retry naturally
    }

    await new Promise((r) => setTimeout(r, POLLING_INTERVAL));
  }
}

main();
