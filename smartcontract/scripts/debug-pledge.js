const hre = require("hardhat");

async function main() {
    const escrowAddress = "0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f";
    const projectId = 1;

    const ProjectEscrow = await hre.ethers.getContractFactory("ProjectEscrow");
    const escrow = await ProjectEscrow.attach(escrowAddress);

    console.log("Checking Escrow:", escrowAddress);
    console.log("Project ID:", projectId);

    const project = await escrow.projects(projectId);
    console.log("Project Data:", {
        creator: project.creator,
        fundingGoal: project.fundingGoal.toString(),
        currentFunding: project.currentFunding.toString(),
        deadline: new Date(Number(project.deadline) * 1000).toLocaleString(),
        status: project.status.toString()
    });
    console.log("On-Chain Current Funding (ETH):", hre.ethers.formatEther(project.currentFunding));

    const milestonesAddr = await escrow.milestonesContract();
    console.log("Milestones Contract Address:", milestonesAddr);

    const Milestones = await hre.ethers.getContractFactory("Milestones");
    const milestones = await Milestones.attach(milestonesAddr);

    const count = await milestones.milestoneCount(projectId);
    console.log("Milestone Count:", count.toString());

    for (let i = 0; i < count; i++) {
        const m = await milestones.getMilestone(projectId, i);
        console.log(`Milestone ${i}:`, {
            amountWei: m.amountWei.toString(),
            exists: m.exists,
            fundsReleased: m.fundsReleased,
            isActivated: m.isActivated,
            votingStarted: m.votingStarted
        });
    }
}

main().catch(console.error);
