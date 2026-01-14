const hre = require("hardhat");

async function main() {
    const escrowAddress = "0x959922bE3CAee4b8Cd9a407cc3ac1C251C2007B1";
    const ProjectEscrow = await hre.ethers.getContractFactory("ProjectEscrow");
    const escrow = await ProjectEscrow.attach(escrowAddress);

    const project = await escrow.projects(7);
    console.log("Project 7 full data:");
    console.log(project);
}

main().catch(console.error);
