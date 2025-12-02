const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const db = require("./db");
const { contract, ethers } = require("./eth");
const { upsertCreator, upsertBacker } = require("./helpers");
const fs = require("fs");

const LOG = (msg) =>
  fs.appendFileSync(__dirname + "/indexer.log", `[${new Date().toISOString()}] ${msg}\n`);

const POLLING_INTERVAL = 5000; // 5 seconds
const CONFIRMATIONS = 5; // Wait for 5 blocks
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
  const escrowAddress = contract.target.toLowerCase();
  const deadlineTs = Number(deadline);
  const creatorWallet = creator.toLowerCase();

  // 1 - Ensure creator exists
  const creatorRes = await db.query(
    `INSERT INTO creators (wallet_address)
       VALUES ($1)
       ON CONFLICT (wallet_address) DO UPDATE SET wallet_address = EXCLUDED.wallet_address
       RETURNING creator_id`,
    [creatorWallet]
  );
  const creatorId = creatorRes.rows[0].creator_id;

  // 2 - Insert project
  await db.query(
    `INSERT INTO projects (
         creator_id,
         escrow_address,
         onchain_project_id,
         funding_goal,
         deadline,
         status,
         created_tx_hash
       )
       VALUES ($1, $2, $3, $4, to_timestamp($5), 1, $6)
       ON CONFLICT (onchain_project_id) DO UPDATE SET created_tx_hash = EXCLUDED.created_tx_hash`,
    [
      creatorId,          // $1
      escrowAddress,      // $2
      onchainId,          // $3
      fundingGoal,        // $4
      deadlineTs,         // $5
      event.transactionHash // $6
    ]
  );
  LOG(`Indexed ProjectCreated → onchainId=${onchainId}`);
}

async function handlePledgeMade(event) {
  const [projectId, backer, amountWei] = event.args;
  const escrow = contract.target.toString().toLowerCase();

  // Find project
  const project_r = await db.query(
    `SELECT project_id FROM projects WHERE onchain_project_id=$1`,
    [Number(projectId)]
  );
  if (project_r.rowCount === 0) {
    LOG("PledgeMade ERROR: project not found for onchain_id=" + projectId);
    return;
  }
  const project_id = project_r.rows[0].project_id;

  const backer_id = await upsertBacker(backer);
  const amount = Number(ethers.formatEther(amountWei));

  // Insert pledge (Idempotent via unique transaction_hash)
  try {
    const res = await db.query(
      `INSERT INTO pledges (project_id, backer_id, amount, status, voting_power, transaction_hash, block_number, pledged_at)
        VALUES ($1,$2,$3,'confirmed',$3, $4, $5, NOW())
        RETURNING pledge_id`,
      [project_id, backer_id, amount, event.transactionHash, event.blockNumber]
    );
    const pledge_id = res.rows[0].pledge_id;

    // Update backer total
    await db.query(
      `UPDATE backers SET total_pledged = COALESCE(total_pledged,0) + $1
        WHERE backer_id=$2`,
      [amount, backer_id]
    );

    // Update project total
    await db.query(
      `UPDATE projects SET current_funding = COALESCE(current_funding,0) + $1
        WHERE project_id=$2`,
      [amount, project_id]
    );

    LOG(`PledgeMade OK: project=${project_id}, amount=${amount}`);
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      console.log("Pledge already indexed:", event.transactionHash);
    } else {
      throw err;
    }
  }
}

async function handleMilestoneSubmitted(event) {
  const [projectId, milestoneId, description, amountWei] = event.args;
  const escrow = contract.target.toString().toLowerCase();

  const project_r = await db.query(
    `SELECT project_id FROM projects WHERE onchain_project_id=$1`,
    [Number(projectId)]
  );
  if (project_r.rowCount === 0) return;
  const project_id = project_r.rows[0].project_id;

  const sessionKey = `P:${Number(projectId)}-M:${Number(milestoneId)}`;
  const amount = Number(ethers.formatEther(amountWei));

  // Insert milestone
  await db.query(
    `INSERT INTO milestones (project_id, title, description, funding_amount, status,
                               voting_session_id, submitted_at, on_chain_id, transaction_hash)
       VALUES ($1, $2, $3, $4, 0, $5, NOW(), $6, $7)
       ON CONFLICT (on_chain_id) DO NOTHING`,
    [project_id, description, description, amount, sessionKey, Number(milestoneId), event.transactionHash]
  );
  LOG(`MilestoneSubmitted OK: ${sessionKey}`);
}

async function handleVoteCast(event) {
  const [projectId, milestoneId, backer, a4, a5] = event.args;
  const approved = typeof a4 === "boolean" ? a4 : a5;
  const weightBn = typeof a4 === "boolean" ? a5 : a4;

  const onchainId = Number(projectId);
  const sessionKey = `P:${onchainId}-M:${Number(milestoneId)}`;

  const backerRes = await db.query(
    `INSERT INTO backers (wallet_address)
       VALUES ($1)
       ON CONFLICT (wallet_address) DO UPDATE SET wallet_address=EXCLUDED.wallet_address
       RETURNING backer_id`,
    [backer.toLowerCase()]
  );
  const backer_id = backerRes.rows[0].backer_id;

  const pr = await db.query(
    `SELECT project_id FROM projects WHERE onchain_project_id=$1`,
    [onchainId]
  );
  if (pr.rowCount === 0) return;
  const project_uuid = pr.rows[0].project_id;

  const ms = await db.query(
    `SELECT milestone_id FROM milestones WHERE project_id=$1 AND on_chain_id=$2`,
    [project_uuid, Number(milestoneId)]
  );
  if (ms.rowCount === 0) return;
  const milestone_uuid = ms.rows[0].milestone_id;

  await db.query(
    `INSERT INTO votes (milestone_id, backer_id, vote_weight, approval, voted_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (milestone_id, backer_id) DO NOTHING`,
    [milestone_uuid, backer_id, weightBn.toString(), approved ? 1 : 0]
  );
}

async function handleFundsReleased(event) {
  const [projectId, milestoneId, amountWei] = event.args;

  const project_r = await db.query(
    `SELECT project_id FROM projects WHERE onchain_project_id=$1`,
    [Number(projectId)]
  );
  if (project_r.rowCount === 0) return;
  const project_id = project_r.rows[0].project_id;

  const ms_r = await db.query(
    `SELECT milestone_id FROM milestones WHERE project_id=$1 AND on_chain_id=$2`,
    [project_id, Number(milestoneId)]
  );
  const milestone_id = ms_r.rows[0]?.milestone_id;
  if (!milestone_id) return;

  const amount = Number(ethers.formatEther(amountWei));

  // Insert release record
  await db.query(
    `INSERT INTO releases (milestone_id, amount, released_at, transaction_hash, status)
       VALUES ($1, $2, NOW(), $3, 1)`,
    [milestone_id, amount, event.transactionHash]
  );

  // Update milestone status = paid
  await db.query(
    `UPDATE milestones SET status=3 WHERE milestone_id=$1`,
    [milestone_id]
  );
  LOG(`FundsReleased OK: amount=${amount}`);
}

async function handleRefundIssued(event) {
  const [projectId, backer, amountWei] = event.args;

  const project_r = await db.query(
    `SELECT project_id FROM projects WHERE onchain_project_id=$1`,
    [Number(projectId)]
  );
  if (project_r.rowCount === 0) return;
  const project_id = project_r.rows[0].project_id;

  const backerRes = await db.query(`SELECT backer_id FROM backers WHERE wallet_address=$1`, [backer.toLowerCase()]);
  if (backerRes.rowCount === 0) return;
  const backer_id = backerRes.rows[0].backer_id;

  const amount = Number(ethers.formatEther(amountWei));

  // Find original pledge to link? Or just insert refund.
  // We need a pledge_id for the Refund model.
  const pledgeRes = await db.query(
    `SELECT pledge_id FROM pledges WHERE project_id=$1 AND backer_id=$2 LIMIT 1`,
    [project_id, backer_id]
  );

  if (pledgeRes.rowCount > 0) {
    const pledge_id = pledgeRes.rows[0].pledge_id;
    await db.query(
      `INSERT INTO refunds (pledge_id, amount, transaction_hash, refunded_at)
             VALUES ($1, $2, $3, NOW())`,
      [pledge_id, amount, event.transactionHash]
    );

    // Update pledge status
    await db.query(`UPDATE pledges SET status='refunded' WHERE pledge_id=$1`, [pledge_id]);

    // Update project funding
    await db.query(
      `UPDATE projects SET current_funding = GREATEST(current_funding - $1, 0)
             WHERE project_id=$2`,
      [amount, project_id]
    );
    LOG(`RefundIssued OK: amount=${amount}`);
  }
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
    } else if (event.eventName === "VoteCast") {
      await handleVoteCast(event);
    } else if (event.eventName === "FundsReleased") {
      await handleFundsReleased(event);
    } else if (event.eventName === "RefundIssued") {
      await handleRefundIssued(event);
    }
  } catch (err) {
    console.error(`Error processing event ${event.eventName} at ${transactionHash}:`, err);
    LOG(`ERROR ${event.eventName}: ${err.message}`);
  }
}

async function main() {
  console.log("Indexer started (Polling Mode).");
  LOG("Indexer booted.");

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
      await new Promise((r) => setTimeout(r, POLLING_INTERVAL));
    }
  }
}

main();
