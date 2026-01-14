const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const db = require("./db");
const { contract, ethers } = require("./eth");
const { findUserByWallet } = require("./helpers");
const fs = require("fs");

const LOG = (msg) =>
  fs.appendFileSync(__dirname + "/indexer.log", `[${new Date().toISOString()}] ${msg}\n`);

const POLLING_INTERVAL = 5000; // 5 seconds
const CONFIRMATIONS = 0; // Immediate for local dev speed
const CHUNK_SIZE = 1000;

async function getLastSyncedBlock() {
  try {
    const res = await db.query(
      "SELECT last_processed_block FROM sync_state WHERE contract_address = $1",
      [contract.target.toLowerCase()]
    );
    if (res.rowCount === 0) {
      await db.query(
        "INSERT INTO sync_state (contract_address, last_processed_block, updated_at) VALUES ($1, 0, NOW())",
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
  try {
    const [projectId, backerWallet, amountWei] = event.args;

    // Find project in Django table
    const project_r = await db.query(
      `SELECT project_id FROM projects WHERE on_chain_id=$1`,
      [Number(projectId)]
    );
    if (project_r.rowCount === 0) {
      LOG("PledgeMade ERROR: project not found for onchain_id=" + projectId);
      return;
    }
    const project_db_id = project_r.rows[0].project_id;

    // Find backer in Django table
    let backer_id = await findUserByWallet(backerWallet);
    if (!backer_id) {
      LOG("PledgeMade ERROR: Backer not found for wallet=" + backerWallet);
      // Auto-create backer to be robust
      LOG("Auto-creating backer...");
      const { v4: uuidv4 } = require('uuid');
      const newBackerId = uuidv4();
      try {
        await db.query(`
            INSERT INTO backers (backer_id, wallet_address, status, total_pledged, registered_at)
            VALUES ($1, $2, 1, 0, NOW())
            ON CONFLICT (wallet_address) DO NOTHING
        `, [newBackerId, backerWallet.toLowerCase()]);

        // Retrieve it (in case conflict happened and we didn't insert)
        const b_res = await db.query("SELECT backer_id FROM backers WHERE LOWER(wallet_address)=$1", [backerWallet.toLowerCase()]);
        if (b_res.rowCount > 0) {
          backer_id = b_res.rows[0].backer_id;
          LOG("Backer auto-created/found: " + backer_id);
        } else {
          LOG("CRITICAL: Failed to auto-create backer");
          return;
        }
      } catch (err) {
        LOG("Error creating backer: " + err.message);
        return;
      }
    }

    const amount = Number(ethers.formatEther(amountWei));

    // Check if pledge already exists (idempotency)
    const existing = await db.query(
      `SELECT pledge_id, status FROM pledges WHERE transaction_hash=$1`,
      [event.transactionHash]
    );

    if (existing.rowCount > 0) {
      if (existing.rows[0].status === 1) {
        LOG("PledgeMade SKIPPED: Already indexed tx=" + event.transactionHash);
        return;
      }
      LOG("PledgeMade: Finalizing PENDING tx=" + event.transactionHash);
      await db.query(
        `UPDATE pledges SET status=1, block_number=$1, voting_power=$2 WHERE transaction_hash=$3`,
        [event.blockNumber, amount, event.transactionHash]
      );
    } else {
      // Insert new pledge into pledges
      try {
        const { v4: uuidv4 } = require('uuid');
        const pledge_id = uuidv4();
        await db.query(
          `INSERT INTO pledges (pledge_id, project_id, backer_id, amount, status, transaction_hash, pledged_at, voting_power, block_number)
          VALUES ($1, $2, $3, $4, 1, $5, NOW(), $6, $7)`,
          [pledge_id, project_db_id, backer_id, amount, event.transactionHash, amount, event.blockNumber]
        );
      } catch (e) {
        LOG("PledgeMade INSERT ERROR: " + e.message);
        return;
      }
    }

    LOG(`PledgeMade OK: project_id=${project_db_id}, amount=${amount}`);


    // Update Project total_pledged and potentially status
    const p_res = await db.query(
      `UPDATE projects 
       SET total_pledged = total_pledged + $1 
       WHERE project_id = $2 
       RETURNING total_pledged, funding_goal`,
      [amount, project_db_id]
    );

    if (p_res.rowCount > 0) {
      const { total_pledged, funding_goal } = p_res.rows[0];
      if (Number(total_pledged) >= Number(funding_goal)) {
        await db.query(
          `UPDATE projects SET status='successful' WHERE project_id=$1`,
          [project_db_id]
        );
        LOG(`Project SUCCESSFUL: project_id=${project_db_id}`);
      }
    }
  } catch (err) {
    console.error("Error inserting pledge or updating project:", err);
    throw err;
  }
}

async function handleMilestoneSubmitted(event) {
  const [projectId, milestoneId, description, amountWei] = event.args;

  LOG(`MilestoneSubmitted: onchainProjectId=${projectId}, milestoneId=${milestoneId}, description=${description}`);

  const project_r = await db.query(
    `SELECT project_id FROM projects WHERE on_chain_id=$1`,
    [Number(projectId)]
  );
  if (project_r.rowCount === 0) {
    LOG(`MilestoneSubmitted: Project with onChainId=${projectId} not found in DB`);
    return;
  }
  const project_db_id = project_r.rows[0].project_id;

  // Find the milestone created by backend that doesn't have on_chain_id yet
  // We match by project and title (since title is usually unique per project)
  const title = description; // In our contract, description is used for title
  const ms_r = await db.query(
    `SELECT milestone_id FROM milestones WHERE project_id=$1 AND title=$2 AND on_chain_id IS NULL`,
    [project_db_id, title]
  );

  if (ms_r.rowCount === 0) {
    LOG(`MilestoneSubmitted: No matching 'Pending' milestone found for project=${project_db_id} title='${title}'`);
  } else {
    const db_milestone_id = ms_r.rows[0].milestone_id;
    await db.query(
      `UPDATE milestones SET on_chain_id=$1, transaction_hash=$2 WHERE milestone_id=$3`,
      [Number(milestoneId), event.transactionHash, db_milestone_id]
    );
    LOG(`MilestoneSubmitted OK: Updated milestone ${db_milestone_id} with on_chain_id=${milestoneId}, keeping status=0 (Pending)`);
  }
}

async function handleFundsReleased(event) {
  const [projectId, milestoneId, amountWei] = event.args;

  const project_r = await db.query(
    `SELECT project_id FROM projects WHERE on_chain_id=$1`,
    [Number(projectId)]
  );
  if (project_r.rowCount === 0) return;
  const project_db_id = project_r.rows[0].project_id;

  const ms_r = await db.query(
    `SELECT milestone_id FROM milestones WHERE project_id=$1 AND on_chain_id=$2`,
    [project_db_id, Number(milestoneId)]
  );
  if (ms_r.rowCount === 0) return;
  const milestone_db_id = ms_r.rows[0].milestone_id;

  // Check idempotency via transaction_hash
  const existingRelease = await db.query(`SELECT id FROM releases WHERE transaction_hash=$1`, [event.transactionHash]);
  if (existingRelease.rowCount > 0) {
    LOG("FundsReleased SKIPPED: Already indexed tx=" + event.transactionHash);
    return;
  }

  const amount = Number(ethers.formatEther(amountWei));

  // Insert release
  await db.query(
    `INSERT INTO releases (milestone_id, amount, transaction_hash, released_at)
       VALUES ($1, $2, $3, NOW())`,
    [milestone_db_id, amount, event.transactionHash]
  );

  // Update milestone status to 3 (DONE/PAID)
  await db.query(
    `UPDATE milestones SET status=3 WHERE milestone_id=$1`,
    [milestone_db_id]
  );
  LOG(`FundsReleased OK: amount=${amount} for milestone=${milestone_db_id}`);
}

async function handleRefundIssued(event) {
  const [projectId, backerWallet, amountWei] = event.args;

  const project_r = await db.query(
    `SELECT project_id FROM projects WHERE on_chain_id=$1`,
    [Number(projectId)]
  );
  if (project_r.rowCount === 0) return;
  const project_db_id = project_r.rows[0].project_id;

  const backer_r = await db.query(`SELECT backer_id FROM backers WHERE wallet_address=$1`, [backerWallet.toLowerCase()]);
  if (backer_r.rowCount === 0) return;
  const backer_id = backer_r.rows[0].backer_id;

  const amount = Number(ethers.formatEther(amountWei));

  // Find pledge to link refund
  const pledgeRes = await db.query(
    `SELECT pledge_id FROM pledges WHERE project_id=$1 AND backer_id=$2 AND status=1 LIMIT 1`,
    [project_db_id, backer_id]
  );
  if (pledgeRes.rowCount === 0) return;
  const pledge_id = pledgeRes.rows[0].pledge_id;

  // Insert refund
  await db.query(
    `INSERT INTO refunds (pledge_id, amount, transaction_hash, refunded_at)
       VALUES ($1, $2, $3, NOW())`,
    [pledge_id, amount, event.transactionHash]
  );

  LOG(`RefundIssued OK: backer=${backerWallet} amount=${amount}`);
}

async function handleVotingStarted(event) {
  const [projectId, milestoneId] = event.args;

  const project_r = await db.query(
    `SELECT project_id FROM projects WHERE on_chain_id=$1`,
    [Number(projectId)]
  );
  if (project_r.rowCount === 0) return;
  const project_db_id = project_r.rows[0].project_id;

  const ms_r = await db.query(
    `SELECT milestone_id FROM milestones WHERE project_id=$1 AND on_chain_id=$2`,
    [project_db_id, Number(milestoneId)]
  );
  if (ms_r.rowCount === 0) return;
  const milestone_db_id = ms_r.rows[0].milestone_id;

  // Status 2 = Voting (Open)
  await db.query(`UPDATE milestones SET status=2 WHERE milestone_id=$1`, [milestone_db_id]);

  LOG(`VotingStarted OK: Updated milestone ${milestone_db_id} to status=2 (Voting)`);
}

async function handleMilestoneActivated(event) {
  const [projectId, milestoneId] = event.args;

  LOG(`MilestoneActivated: onchainProjectId=${projectId}, milestoneId=${milestoneId}`);

  const project_r = await db.query(
    `SELECT project_id FROM projects WHERE on_chain_id=$1`,
    [Number(projectId)]
  );
  if (project_r.rowCount === 0) return;
  const project_db_id = project_r.rows[0].project_id;

  const ms_r = await db.query(
    `SELECT milestone_id FROM milestones WHERE project_id=$1 AND on_chain_id=$2`,
    [project_db_id, Number(milestoneId)]
  );
  if (ms_r.rowCount === 0) {
    LOG(`MilestoneActivated WARNING: No matching milestone found for project=${project_db_id} on_chain_id=${milestoneId}`);
    return;
  }
  const milestone_db_id = ms_r.rows[0].milestone_id;

  // Status 1 = Active
  await db.query(`UPDATE milestones SET is_activated=true, status=1 WHERE milestone_id=$1`, [milestone_db_id]);

  LOG(`MilestoneActivated OK: Updated milestone ${milestone_db_id} to is_activated=true, status=1`);
}

async function handleMilestoneRefunded(event) {
  const [projectId, milestoneId] = event.args;

  const project_r = await db.query(
    `SELECT project_id FROM projects WHERE on_chain_id=$1`,
    [Number(projectId)]
  );
  if (project_r.rowCount === 0) return;
  const project_db_id = project_r.rows[0].project_id;

  const ms_r = await db.query(
    `SELECT milestone_id FROM milestones WHERE project_id=$1 AND on_chain_id=$2`,
    [project_db_id, Number(milestoneId)]
  );
  if (ms_r.rowCount === 0) return;
  const milestone_db_id = ms_r.rows[0].milestone_id;

  // Status 4 = Rejected/Failed
  await db.query(`UPDATE milestones SET status=4 WHERE milestone_id=$1`, [milestone_db_id]);

  LOG(`MilestoneRefunded OK: Updated milestone ${milestone_db_id} to status=4 (Rejected)`);
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
    } else if (event.eventName === "MilestoneActivated") {
      await handleMilestoneActivated(event);
    } else if (event.eventName === "FundsReleased") {
      await handleFundsReleased(event);
    } else if (event.eventName === "RefundIssued") {
      await handleRefundIssued(event);
    } else if (event.eventName === "VotingStarted") {
      await handleVotingStarted(event);
    } else if (event.eventName === "MilestoneRefunded") {
      await handleMilestoneRefunded(event);
    }
  } catch (err) {
    LOG(`ERROR processing ${event.eventName}: ${err.message}`);
    console.error(`Error processing ${event.eventName}:`, err);
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
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    LOG("sync_state table ensured (PostgreSQL mode).");
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
