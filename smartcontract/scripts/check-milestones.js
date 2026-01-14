const hre = require("hardhat");

async function main() {
    const deployments = require("../deployments.json");
    const milestonesAddress = deployments.addresses.Milestones;
    const Milestones = await hre.ethers.getContractAt("Milestones", milestonesAddress);
    const escrowAddress = deployments.addresses.ProjectEscrow;
    const ProjectEscrow = await hre.ethers.getContractAt("ProjectEscrow", escrowAddress);

    const nextId = await ProjectEscrow.nextProjectId();
    console.log(`Next Project ID: ${nextId}`);

    for (let pId = 0; pId < nextId; pId++) {
        const count = await Milestones.milestoneCount(pId);
        console.log(`\nProject ${pId} has ${count} milestones.`);

        for (let i = 0; i < count; i++) {
            const [amount, exists, released, activated, votingStarted] = await Milestones.getMilestone(pId, i);
            console.log(`  Milestone ${i}: Amount=${hre.ethers.formatEther(amount)} ETH, Activated=${activated}, VotingStarted=${votingStarted}`);
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
