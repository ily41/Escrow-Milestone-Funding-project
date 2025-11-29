require("dotenv").config();

const db = require("./db");
const { contract, ethers } = require("./eth");
const {
  upsertCreator,
  upsertBacker
} = require("./helpers");

const fs = require("fs");
const LOG = (msg) =>
  fs.appendFileSync(__dirname + "/indexer.log", `[${new Date().toISOString()}] ${msg}\n`);

console.log("Indexer started. Listening for events…");
LOG("Indexer booted.");


//
// -------------------------------------------------------------
//  EVENT: ProjectCreated(projectId, creator, goalWei, deadline)
// -------------------------------------------------------------
//
contract.on("ProjectCreated", async (projectId, creator, fundingGoal, deadline, event) => {
  console.log("ProjectCreated");

  try {
    const onchainId = Number(projectId);
    const escrowAddress = contract.target.toLowerCase();

    // Convert deadline (uint) to timestamp
    const deadlineTs = Number(deadline);

    // Normalize creator wallet
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

    // 2 - Insert project (NOW with 5 parameters)
    await db.query(
      `INSERT INTO projects (
         creator_id,
         escrow_address,
         onchain_project_id,
         funding_goal,
         deadline,
         status
       )
       VALUES ($1, $2, $3, $4, to_timestamp($5), 1)
       ON CONFLICT (escrow_address, onchain_project_id) DO NOTHING`,
      [
        creatorId,          // $1
        escrowAddress,      // $2
        onchainId,          // $3
        fundingGoal,        // $4
        deadlineTs          // $5
      ]
    );

    console.log(`Indexed ProjectCreated → onchainId=${onchainId}`);

  } catch (err) {
    console.error("ProjectCreated ERROR:", err);
  }
});


//
// -------------------------------------------------------------
//  EVENT: PledgeMade(projectId, backer, amountWei)
// -------------------------------------------------------------
//
contract.on("PledgeMade", async (projectId, backer, amountWei, event) => {
  try {
    const escrow = contract.target.toString().toLowerCase();

    // Find project by escrow (unique)
    const project_r = await db.query(
      `SELECT project_id FROM projects WHERE escrow_address=$1`,
      [escrow]
    );
    if (project_r.rowCount === 0) {
      LOG("PledgeMade ERROR: project not found for escrow=" + escrow);
      return;
    }
    const project_id = project_r.rows[0].project_id;

    const backer_id = await upsertBacker(backer);
    const amount = Number(ethers.formatEther(amountWei));

    // Insert pledge
    const res = await db.query(
      `INSERT INTO pledges (project_id, backer_id, amount, status, voting_power)
       VALUES ($1,$2,$3,1,$3)
       RETURNING pledge_id`,
      [project_id, backer_id, amount]
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

    // Audit log
    await db.query(
      `INSERT INTO audit_logs (action_type, user_id, user_type, entity_type, entity_id,
                               contract_address, function_name, parameters, transaction_hash)
       VALUES ('PledgeMade', $1, 2, 2, $2, $3, 'pledge',
               $4, $5)`,
      [
        backer_id,
        pledge_id,
        escrow,
        JSON.stringify({ onchainProjectId: Number(projectId), amount }),
        event.transactionHash
      ]
    );

    console.log(`Indexed PledgeMade → project=${project_id}, amount=${amount}`);
    LOG(`PledgeMade OK: project=${project_id}, amount=${amount}`);
  } catch (err) {
    console.error("PledgeMade ERROR:", err);
    LOG("PledgeMade ERROR: " + err.message);
  }
});


//
// -------------------------------------------------------------
//  EVENT: MilestoneSubmitted(projectId, milestoneId, desc, amountWei)
// -------------------------------------------------------------
//
contract.on("MilestoneSubmitted", async (projectId, milestoneId, description, amountWei, event) => {
  try {
    const escrow = contract.target.toString().toLowerCase();

    // find project
    const project_r = await db.query(
      `SELECT project_id FROM projects WHERE escrow_address=$1`,
      [escrow]
    );
    if (project_r.rowCount === 0) {
      LOG("MilestoneSubmitted ERROR: project not found.");
      return;
    }
    const project_id = project_r.rows[0].project_id;

    const sessionKey = `P:${Number(projectId)}-M:${Number(milestoneId)}`;
    const amount = Number(ethers.formatEther(amountWei));

    // Insert milestone
    const res = await db.query(
      `INSERT INTO milestones (project_id, title, description, funding_amount, status,
                               voting_session_id, submitted_at)
       VALUES ($1, $2, $3, $4, 0, $5, NOW())
       RETURNING milestone_id`,
      [project_id, description, description, amount, sessionKey]
    );

    const milestone_id = res.rows[0].milestone_id;

    // Audit
    await db.query(
      `INSERT INTO audit_logs (action_type, entity_type, entity_id, contract_address,
                               function_name, parameters, transaction_hash)
       VALUES ('MilestoneSubmitted', 3, $1, $2, 'submitMilestone', $3, $4)`,
      [
        milestone_id,
        escrow,
        JSON.stringify({ sessionKey, amount }),
        event.transactionHash
      ]
    );

    console.log(`Indexed MilestoneSubmitted → ${sessionKey}`);
    LOG(`MilestoneSubmitted OK: ${sessionKey}`);
  } catch (err) {
    console.error("MilestoneSubmitted ERROR:", err);
    LOG("MilestoneSubmitted ERROR: " + err.message);
  }
});


//
// -------------------------------------------------------------
//  EVENT: VoteCast(projectId, milestoneId, voter, weightWei, support)
// -------------------------------------------------------------
//
contract.on("VoteCast", async (projectId, milestoneId, backer, a4, a5, event) => {
  try {
    // Auto-detect which arg is weight and which is approved
    // If a4 is boolean, order is (..., approved, weight)
    const approved = typeof a4 === "boolean" ? a4 : a5;
    const weightBn = typeof a4 === "boolean" ? a5 : a4;

    // SAFE log: only format the numeric BigNumberish
    console.log(
      `Indexed VoteCast → project=${projectId} milestone=${milestoneId} ` +
      `weight=${ethers.formatEther(weightBn)} approved=${approved}`
    );

    const escrow = contract.target.toLowerCase();
    const onchainId = Number(projectId);
    const sessionKey = `P:${onchainId}-M:${Number(milestoneId)}`;

    // ensure backer exists
    const backerRes = await db.query(
      `INSERT INTO backers (wallet_address)
       VALUES ($1)
       ON CONFLICT (wallet_address) DO UPDATE SET wallet_address=EXCLUDED.wallet_address
       RETURNING backer_id`,
      [backer.toLowerCase()]
    );
    const backer_id = backerRes.rows[0].backer_id;

    // find project
    const pr = await db.query(
      `SELECT project_id FROM projects
       WHERE escrow_address=$1 AND onchain_project_id=$2`,
      [escrow, onchainId]
    );
    if (pr.rowCount === 0) { console.log("VoteCast skipped → project not in DB"); return; }
    const project_uuid = pr.rows[0].project_id;

    // find milestone
    const ms = await db.query(
      `SELECT milestone_id FROM milestones
       WHERE project_id=$1 AND voting_session_id=$2`,
      [project_uuid, sessionKey]
    );
    if (ms.rowCount === 0) { console.log("VoteCast skipped → milestone not in DB"); return; }
    const milestone_uuid = ms.rows[0].milestone_id;

    // insert vote (store bool as int)
    await db.query(
      `INSERT INTO votes (milestone_id, backer_id, vote_weight, approval, voted_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [milestone_uuid, backer_id, weightBn.toString(), approved ? 1 : 0]
    );

    // (optional) audit log here…

  } catch (err) {
    console.error("VoteCast ERROR:", err);
  }
});







//
// -------------------------------------------------------------
//  EVENT: FundsReleased(projectId, milestoneId, amountWei)
// -------------------------------------------------------------
//
contract.on("FundsReleased", async (projectId, milestoneId, amountWei, event) => {
  try {
    const escrow = contract.target.toString().toLowerCase();
    const project_r = await db.query(
      `SELECT project_id FROM projects WHERE escrow_address=$1`,
      [escrow]
    );
    const project_id = project_r.rows[0]?.project_id;
    if (!project_id) return;

    const sessionKey = `P:${Number(projectId)}-M:${Number(milestoneId)}`;

    const ms_r = await db.query(
      `SELECT milestone_id FROM milestones WHERE project_id=$1 AND voting_session_id=$2`,
      [project_id, sessionKey]
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

    // Audit
    await db.query(
      `INSERT INTO audit_logs (action_type, entity_type, entity_id,
                               contract_address, function_name,
                               parameters, transaction_hash)
       VALUES ('FundsReleased', 5, $1, $2, 'releaseFunds', $3, $4)`,
      [
        milestone_id,
        escrow,
        JSON.stringify({ sessionKey, amount }),
        event.transactionHash
      ]
    );

    console.log(`Indexed FundsReleased → ${sessionKey} amount=${amount}`);
    LOG(`FundsReleased OK: ${sessionKey}, amount=${amount}`);
  } catch (err) {
    console.error("FundsReleased ERROR:", err);
    LOG("FundsReleased ERROR: " + err.message);
  }
});
