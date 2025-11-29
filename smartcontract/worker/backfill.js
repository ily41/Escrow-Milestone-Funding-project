// worker/backfill.js
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { provider, contract, ethers } = require("./eth");

// IMPORTANT: we import indexer so its event handlers are registered in this process.
// Then we will "replay" historical logs into those same handlers.
require("./indexer");

const LOG_PATH = path.join(__dirname, "backfill.log");
const log = (m) => fs.appendFileSync(LOG_PATH, `[${new Date().toISOString()}] ${m}\n`);

const CHUNK_SIZE = parseInt(process.env.BACKFILL_CHUNK_SIZE ?? "4000", 10);
const MAX_RETRIES = 6;

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function getTopicHash(name) {
  const ev = contract.interface.getEvent(name);
  return ev.topicHash; // ethers v6
}

async function safeGetLogs(params) {
  let attempt = 0;
  while (true) {
    try {
      return await provider.getLogs(params);
    } catch (err) {
      // Handle common rate-limit / busy node cases gracefully
      const msg = (err && err.message) ? err.message : String(err);
      const code = err?.code;
      attempt++;

      if (attempt > MAX_RETRIES) {
        log(`[FATAL] getLogs failed after ${MAX_RETRIES} attempts: ${msg}`);
        throw err;
      }

      // Backoff algorithm
      const backoff = Math.min(15000, 500 * 2 ** attempt);
      log(`[WARN] getLogs retry ${attempt}/${MAX_RETRIES} in ${backoff}ms (code=${code}): ${msg}`);
      await sleep(backoff);
    }
  }
}

async function backfillOneEvent(name, topic0, fromBlock, toBlock) {
  let count = 0;
  for (let start = fromBlock; start <= toBlock; start += CHUNK_SIZE + 1) {
    const end = Math.min(toBlock, start + CHUNK_SIZE);
    const logs = await safeGetLogs({
      address: contract.target,
      fromBlock: start,
      toBlock: end,
      topics: [topic0]
    });

    if (logs.length) {
      log(`[${name}] chunk ${start}-${end} → ${logs.length} logs`);
    }

    for (const lg of logs) {
      // parse & "re-emit" into the indexer’s live handlers
      const parsed = contract.interface.parseLog(lg);
      // contract is an EventEmitter; this will trigger the .on(...) handlers defined in indexer.js
      contract.emit(name, ...parsed.args, { transactionHash: lg.transactionHash });
      count++;
    }
  }
  return count;
}

(async () => {
  const t0 = Date.now();
  log("=== Backfill start ===");

  // Determine range
  const latest = await provider.getBlockNumber();
  // You can set FROM_BLOCK / TO_BLOCK in .env to limit range; otherwise full scan (slow)
  const FROM_BLOCK = process.env.FROM_BLOCK ? parseInt(process.env.FROM_BLOCK, 10) : 0;
  const TO_BLOCK   = process.env.TO_BLOCK   ? parseInt(process.env.TO_BLOCK, 10) : latest;

  log(`Network OK. Latest block: ${latest}. Range: ${FROM_BLOCK} → ${TO_BLOCK}`);
  console.log(`Backfill range: ${FROM_BLOCK} → ${TO_BLOCK}`);

  // Prepare topics
  const events = [
    "ProjectCreated",
    "PledgeMade",
    "MilestoneSubmitted",
    "VoteCast",
    "FundsReleased",
  ];

  const topics = {};
  for (const ev of events) topics[ev] = await getTopicHash(ev);

  // Run each event type (order doesn’t strictly matter; this is logical)
  const summary = {};
  for (const ev of events) {
    console.log(`Scanning ${ev}…`);
    const n = await backfillOneEvent(ev, topics[ev], FROM_BLOCK, TO_BLOCK);
    summary[ev] = n;
    log(`[SUMMARY] ${ev}: ${n}`);
  }

  const secs = ((Date.now() - t0) / 1000).toFixed(2);
  log(`=== Backfill done in ${secs}s ===`);
  console.log("Backfill complete.");
  console.table(summary);
})();
