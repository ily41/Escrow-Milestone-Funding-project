const { ethers } = require('ethers');
const db = require('./db');
const { v4: uuidv4 } = require('uuid');
const abi = require('../artifacts/contracts/ProjectEscrow.sol/ProjectEscrow.json').abi;
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function run() {
    console.log("Starting E2E Verification...");

    // Setup Helper
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    // Use the hardhat account #0 for creator (deployer) usually, but let's use a specific one
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, abi, wallet);

    // Create random backer wallet (simulated)
    // We actually need a wallet with ETH to pledge. 
    // Hardhat node has multiple pre-funded accounts.
    // Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
    // Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
    const backerWallet = new ethers.Wallet('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', provider);

    try {
        // 0. Register Creator in DB (Required for Indexer)
        console.log("\n0. Registering Creator in DB...");
        await db.query(`
            INSERT INTO backers (backer_id, wallet_address, status, total_pledged, registered_at)
            VALUES ($1, $2, 1, 0, NOW())
            ON CONFLICT (wallet_address) DO NOTHING
        `, [uuidv4(), wallet.address.toLowerCase()]);

        // 1. Create Project on Backend (Pending)
        console.log("\n1. Creating Project on Backend...");
        const projectId = uuidv4();
        try {
            await db.query(`
                INSERT INTO projects (project_id, title, funding_goal, creator_address, status, escrow_address, deadline, total_pledged)
                VALUES ($1, 'E2E Test Project', 10, $2, 'active', '0x0000000000000000000000000000000000000000', NOW() + interval '1 hour', 0)
            `, [projectId, wallet.address.toLowerCase()]);
            console.log(`   Project DB ID: ${projectId} - Inserted Successfully`);
        } catch (e) {
            console.error("   FAILED to insert project into DB:", e.message);
            throw e;
        }

        // 2. Deploy Project on Blockchain
        console.log("\n2. Deploying Project on Chain...");
        const tx1 = await contract.createProject(
            ethers.parseEther("10"), // goal
            Math.floor(Date.now() / 1000) + 3600 // deadline
        );
        const receipt1 = await tx1.wait();
        // Mine a block to ensure Confirmation > 1
        console.log("   Mining block to confirm...");
        await provider.send("evm_mine", []);

        // Find ProjectCreated event
        let onChainProjectId;
        for (const log of receipt1.logs) {
            try {
                const parsed = contract.interface.parseLog(log);
                if (parsed.name === 'ProjectCreated') {
                    onChainProjectId = Number(parsed.args.projectId);
                    break;
                }
            } catch (e) { }
        }
        console.log(`   On-Chain Project ID: ${onChainProjectId}`);

        // Wait for Indexer to Sync Project
        console.log("   Waiting for indexer to sync project...");
        let synced = false;
        for (let i = 0; i < 20; i++) {
            const res = await db.query("SELECT on_chain_id FROM projects WHERE project_id = $1", [projectId]);
            // Hint: indexer normally finds project by transaction hash or we need to link it.
            // Beacuse we inserted backend project manually, indexer might create a DUPLICATE or NOT LINK if logic isn't perfect.
            // Let's check how indexer links. 
            // Indexer `handleProjectCreated`: tries to find project by... wait.
            // Actually, indexer usually CREATES the project in DB if not found?
            // Or updates?
            // Let's manually link them to simulate the frontend flow where backend stores txHash and indexer updates.
            // We'll update our DB record with on_chain_id manually to "simulate" that part if indexer doesn't match by title.
            // Checking indexer.js handleProjectCreated... 
            // It inserts a NEW project if not found.
            // Let's Assume indexer creates a new one, we will switch to using THAT one.

            const p_res = await db.query("SELECT project_id, total_pledged FROM projects WHERE on_chain_id = $1", [onChainProjectId]);
            if (p_res.rowCount > 0) {
                console.log(`   Indexer synced! DB ID: ${p_res.rows[0].project_id}`);
                // Use the indexer-created project ID if it made a new one
                // Or if it matched ours.
                synced = true;
                break;
            }
            await sleep(1000);
        }
        if (!synced) throw new Error("Indexer failed to sync created project");

        // 3. Create Milestone (Backend)
        console.log("\n3. Creating Milestone on Backend...");
        const milestoneId = uuidv4();
        // We need the DB project ID that corresponds to the on-chain ID
        const p_res = await db.query("SELECT project_id FROM projects WHERE on_chain_id = $1", [onChainProjectId]);
        const dbProjectId = p_res.rows[0].project_id;

        await db.query(`
            INSERT INTO milestones (milestone_id, project_id, title, funding_amount, status, is_activated, description)
            VALUES ($1, $2, 'E2E Milestone', 5, 0, false, 'Test Description')
        `, [milestoneId, dbProjectId]);

        // 4. Submit Milestone to Blockchain
        console.log("\n4. Submitting Milestone on Chain...");
        const tx2 = await contract.submitMilestone(onChainProjectId, "E2E Milestone", ethers.parseEther("5"));
        const receipt2 = await tx2.wait();
        await provider.send("evm_mine", []);

        let onChainMilestoneId;
        for (const log of receipt2.logs) {
            try {
                const parsed = contract.interface.parseLog(log);
                if (parsed.name === 'MilestoneSubmitted') {
                    onChainMilestoneId = Number(parsed.args.milestoneId);
                    break;
                }
            } catch (e) { }
        }
        console.log(`   On-Chain Milestone ID: ${onChainMilestoneId}`);

        // Wait for Indexer to sync Milestone OnChainID
        console.log("   Waiting for indexer to sync milestone submission...");
        synced = false;
        for (let i = 0; i < 20; i++) {
            const m_res = await db.query("SELECT on_chain_id FROM milestones WHERE on_chain_id = $1", [onChainMilestoneId]);
            if (m_res.rowCount > 0) {
                synced = true;
                break;
            }
            await sleep(1000);
        }
        if (!synced) {
            // Debug: check if indexer created a duplicate milestone?
            console.log("   Indexer slow... checking all milestones...");
        }

        // 5. Activate Milestone
        console.log("\n5. Activating Milestone...");
        const tx3 = await contract.activateMilestone(onChainProjectId, onChainMilestoneId);
        await tx3.wait();
        console.log("   Activation Tx sent.");
        await provider.send("evm_mine", []);

        // Wait for Indexer to set is_activated = true
        console.log("   Waiting for indexer to mark activated...");
        for (let i = 0; i < 20; i++) {
            const m_res = await db.query("SELECT is_activated, status FROM milestones WHERE on_chain_id = $1", [onChainMilestoneId]);
            if (m_res.rows[0].is_activated === true && m_res.rows[0].status === 1) {
                console.log("   Indexer synced activation! Status=1, IsActivated=True");
                synced = true;
                break;
            }
            await sleep(1000);
        }

        // 6. Pledge (Backer)
        console.log("\n6. Pledging 1 ETH...");
        // Ensure backer exists in DB first (Indexer should create it on pledge, but let's see)
        // Actually, our previous fix ensures `sync_pledges` creates backer? 
        // No, `create_backer.js` was manual.
        // `indexer.js` `handlePledgeMade` calls `findUserByWallet`.
        // If it returns null, indexer FAILs.
        // We need to ensure logic handles new backers. 
        // The indexer normally expects the user to exist (registered on platform).
        // So we MUST insert the backer into DB first simulating registration.

        await db.query(`
            INSERT INTO backers (backer_id, wallet_address, status, total_pledged, registered_at)
            VALUES ($1, $2, 1, 0, NOW())
            ON CONFLICT (wallet_address) DO NOTHING
        `, [uuidv4(), backerWallet.address.toLowerCase()]);
        console.log("   Backer registered in DB.");

        const contractBacker = contract.connect(backerWallet);
        const tx4 = await contractBacker.pledge(onChainProjectId, { value: ethers.parseEther("1.0") });
        await tx4.wait();
        console.log("   Pledge Tx sent.");
        await provider.send("evm_mine", []);

        // 7. Verify Progress Bar (Total Pledged)
        console.log("\n7. Verifying Progress updates...");
        let success = false;
        for (let i = 0; i < 60; i++) {
            const p_res = await db.query("SELECT total_pledged FROM projects WHERE on_chain_id = $1", [onChainProjectId]);
            const total = Number(p_res.rows[0].total_pledged);
            console.log(`   Current DB Total Pledged: ${total}`);

            if (total >= 1.0) {
                console.log("   SUCCESS! Database updated automatically.");
                success = true;
                break;
            }
            await sleep(1000);
        }

        if (!success) throw new Error("Database did not update total_pledged after 30 seconds.");

    } catch (err) {
        console.error("\nE2E TEST FAILED:", err);
        process.exit(1);
    } finally {
        await db.close();
        process.exit(0);
    }
}

run();
