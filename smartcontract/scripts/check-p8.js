
const hre = require("hardhat");

async function main() {
    const deployments = require("../deployments.json");
    const escrowAddress = deployments.addresses.ProjectEscrow;
    const ProjectEscrow = await hre.ethers.getContractAt("ProjectEscrow", escrowAddress);

    const p = await ProjectEscrow.projects(8);
    console.log('Project 8:');
    console.log('  Current Funding:', hre.ethers.formatEther(p.currentFunding), 'ETH');
    console.log('  Funding Goal:', hre.ethers.formatEther(p.fundingGoal), 'ETH');

    const Milestones = await hre.ethers.getContractAt("Milestones", deployments.addresses.Milestones);
    const count = await Milestones.milestoneCount(8);
    for (let i = 0; i < count; i++) {
        const m = await Milestones.getMilestone(8, i);
        console.log(`MILESTONE_CHECK: ID=${i} AMOUNT=${hre.ethers.formatEther(m[0])} ACTIVATED=${m[3]} VOTING=${m[4]}`);
    }
}

main().catch(console.error);
