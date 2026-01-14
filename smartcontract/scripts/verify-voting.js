const hre = require("hardhat");

async function main() {
    const escrowAddress = "0x36C02dA8a0983159322a80FFE9F24b1acfF8B570";
    const ProjectEscrow = await hre.ethers.getContractFactory("ProjectEscrow");
    const escrow = await ProjectEscrow.attach(escrowAddress);

    const [creator, backer] = await hre.ethers.getSigners();
    console.log("Using Creator:", creator.address);
    console.log("Using Backer:", backer.address);

    // 1. Create Project
    const goal = hre.ethers.parseEther("10");
    const deadline = Math.floor(Date.now() / 1000) + 3600;
    console.log("Creating project...");
    let tx = await escrow.connect(creator).createProject(goal, deadline);
    let receipt = await tx.wait();

    // Extract project ID (should be 0)
    const projId = 0;
    console.log("Project 0 created.");

    // 2. Submit Milestone
    console.log("Submitting milestone...");
    const milestoneAmt = hre.ethers.parseEther("5");
    tx = await escrow.connect(creator).submitMilestone(projId, "Milestone 1", milestoneAmt);
    await tx.wait();
    console.log("Milestone 0 submitted.");

    // 3. Activate Milestone
    console.log("Activating milestone...");
    tx = await escrow.connect(creator).activateMilestone(projId, 0);
    await tx.wait();
    console.log("Milestone 0 activated.");

    // 4. Pledge (to reach target)
    console.log("Pledging 5 ETH...");
    tx = await escrow.connect(backer).pledge(projId, { value: milestoneAmt });
    receipt = await tx.wait();
    console.log("Pledge completed.");

    // 5. Check for VotingStarted event
    const votingStartedEvents = receipt.logs.filter(log => {
        try {
            const parsed = escrow.interface.parseLog(log);
            return parsed.name === "VotingStarted";
        } catch (e) { return false; }
    });

    if (votingStartedEvents.length > 0) {
        const parsed = escrow.interface.parseLog(votingStartedEvents[0]);
        console.log("SUCCESS: VotingStarted emitted!");
        console.log("Project ID:", parsed.args.projectId.toString(), "Milestone ID:", parsed.args.milestoneId.toString());
    } else {
        console.log("FAILURE: VotingStarted NOT emitted.");

        // Detailed Debug
        const milAddress = await escrow.milestonesContract();
        const mils = await hre.ethers.getContractAt("Milestones", milAddress);
        const m = await mils.getMilestone(projId, 0);
        const p = await escrow.projects(projId);
        console.log("On-chain state:");
        console.log(`- Project Funding: ${hre.ethers.formatEther(p.currentFunding)} ETH`);
        console.log(`- Milestone Amount: ${hre.ethers.formatEther(m.amountWei)} ETH`);
        console.log(`- Milestone Activated: ${m.isActivated}`);
        console.log(`- Milestone VotingStarted: ${m.votingStarted}`);
    }
}

main().catch(console.error);
