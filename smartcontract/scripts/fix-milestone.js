const hre = require("hardhat");

async function main() {
    const escrowAddress = "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f";
    const projectId = 1;
    const milestoneId = 0;

    const ProjectEscrow = await hre.ethers.getContractFactory("ProjectEscrow");
    const escrow = await ProjectEscrow.attach(escrowAddress);

    console.log("Activating milestone on-chain...");
    console.log("Escrow:", escrowAddress);
    console.log("Project ID:", projectId);
    console.log("Milestone ID:", milestoneId);

    const tx = await escrow.activateMilestone(projectId, milestoneId);
    console.log("Transaction sent:", tx.hash);
    await tx.wait();
    console.log("Milestone activated!");

    // Verify
    const milestonesAddr = await escrow.milestonesContract();
    const Milestones = await hre.ethers.getContractFactory("Milestones");
    const milestones = await Milestones.attach(milestonesAddr);
    const m = await milestones.getMilestone(projectId, milestoneId);
    console.log("Verification - isActivated:", m.isActivated);
}

main().catch(console.error);
