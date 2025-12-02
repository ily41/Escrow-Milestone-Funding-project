const hre = require("hardhat");

async function main() {
    // Get the deployed contract address from your .env or deployments.json
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

    console.log("📝 Connecting to ProjectEscrow contract at:", contractAddress);
    const contract = await hre.ethers.getContractAt("ProjectEscrow", contractAddress);

    const [creator, backer1, backer2] = await hre.ethers.getSigners();

    console.log("\n👤 Using accounts:");
    console.log("Creator:", creator.address);
    console.log("Backer1:", backer1.address);
    console.log("Backer2:", backer2.address);

    // 1. Create a project
    console.log("\n🚀 Step 1: Creating project...");
    const goalWei = hre.ethers.parseEther("10"); // 10 ETH goal
    const deadline = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days from now

    const tx1 = await contract.createProject(goalWei, deadline);
    const receipt1 = await tx1.wait();
    console.log("✅ Project created! Tx:", receipt1.hash);

    const projectId = 0; // First project

    // 2. Submit a milestone
    console.log("\n📋 Step 2: Submitting milestone...");
    const milestoneAmount = hre.ethers.parseEther("3"); // 3 ETH for first milestone

    const tx2 = await contract.submitMilestone(
        projectId,
        "Build MVP",
        milestoneAmount
    );
    const receipt2 = await tx2.wait();
    console.log("✅ Milestone submitted! Tx:", receipt2.hash);

    const milestoneId = 0; // First milestone

    // 3. Activate the milestone
    console.log("\n⚡ Step 3: Activating milestone...");
    const tx3 = await contract.activateMilestone(projectId, milestoneId);
    const receipt3 = await tx3.wait();
    console.log("✅ Milestone activated! Tx:", receipt3.hash);

    // 4. Make pledges from backers
    console.log("\n💰 Step 4: Making pledges...");

    const pledge1Amount = hre.ethers.parseEther("2");
    const tx4 = await contract.connect(backer1).pledge(projectId, { value: pledge1Amount });
    const receipt4 = await tx4.wait();
    console.log("✅ Backer1 pledged 2 ETH! Tx:", receipt4.hash);

    const pledge2Amount = hre.ethers.parseEther("1.5");
    const tx5 = await contract.connect(backer2).pledge(projectId, { value: pledge2Amount });
    const receipt5 = await tx5.wait();
    console.log("✅ Backer2 pledged 1.5 ETH! Tx:", receipt5.hash);

    // 5. Vote on milestone
    console.log("\n🗳️  Step 5: Voting on milestone...");

    const tx6 = await contract.connect(backer1).voteOnMilestone(projectId, milestoneId, true);
    const receipt6 = await tx6.wait();
    console.log("✅ Backer1 voted YES! Tx:", receipt6.hash);

    const tx7 = await contract.connect(backer2).voteOnMilestone(projectId, milestoneId, true);
    const receipt7 = await tx7.wait();
    console.log("✅ Backer2 voted YES! Tx:", receipt7.hash);

    console.log("\n🎉 Test data created successfully!");
    console.log("\n📊 Summary:");
    console.log("- Project ID:", projectId);
    console.log("- Milestone ID:", milestoneId);
    console.log("- Total pledged: 3.5 ETH");
    console.log("- Votes: 2 YES");
    console.log("\n💡 Now check:");
    console.log("1. Indexer logs - should show events being processed");
    console.log("2. API at http://localhost:8000/api/docs/");
    console.log("   - GET /api/projects/");
    console.log("   - GET /api/milestones/");
    console.log("   - GET /api/pledges/");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
