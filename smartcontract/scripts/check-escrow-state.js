const hre = require("hardhat");

async function main() {
    const deployments = require("../deployments.json");
    const escrowAddress = deployments.addresses.ProjectEscrow;
    const ProjectEscrow = await hre.ethers.getContractAt("ProjectEscrow", escrowAddress);

    const milestonesAddr = await ProjectEscrow.milestonesContract();
    console.log(`Stored Milestones Address: ${milestonesAddr}`);
    console.log(`Expected Milestones Address: ${deployments.addresses.Milestones}`);

    const nextId = await ProjectEscrow.nextProjectId();
    console.log(`Next Project ID: ${nextId}`);

    const project1 = await ProjectEscrow.projects(1);
    console.log(`Project 1 Creator: ${project1.creator}`);

    const mCount = await (await hre.ethers.getContractAt("Milestones", milestonesAddr)).milestoneCount(1);
    console.log(`Milestone Count for Project 1 on stored contract: ${mCount}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
