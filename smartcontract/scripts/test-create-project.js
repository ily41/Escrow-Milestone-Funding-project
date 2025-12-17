const hre = require("hardhat");
const fs = require("fs");

async function main() {
    const [signer] = await hre.ethers.getSigners();
    console.log("Testing with account:", signer.address);

    // Read deployment config
    const deployments = JSON.parse(fs.readFileSync("./deployments.json", "utf8"));
    const escrowAddress = deployments.addresses.ProjectEscrow;
    console.log("Using ProjectEscrow at:", escrowAddress);

    const ProjectEscrow = await hre.ethers.getContractFactory("ProjectEscrow");
    const escrow = ProjectEscrow.attach(escrowAddress);

    console.log("\nAttempting to create project...");
    const fundingGoal = hre.ethers.parseEther("5");
    const deadline = 1767324420;

    console.log("Funding goal:", fundingGoal.toString());
    console.log("Deadline:", deadline);
    console.log("Current block timestamp:", (await hre.ethers.provider.getBlock('latest')).timestamp);

    try {
        const tx = await escrow.createProject(fundingGoal, deadline);
        console.log("\nTransaction hash:", tx.hash);

        const receipt = await tx.wait();
        console.log("Transaction confirmed!");
        console.log("Logs count:", receipt.logs.length);
        console.log("Receipt:", JSON.stringify(receipt, null, 2));

        // Try to parse logs
        for (const log of receipt.logs) {
            try {
                const parsed = escrow.interface.parseLog(log);
                console.log("\nParsed event:", parsed.name);
                console.log("Event args:", parsed.args);
            } catch (e) {
                console.log("Could not parse log:", e.message);
            }
        }
    } catch (error) {
        console.error("\nError creating project:", error);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
