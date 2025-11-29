const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("\n🚀 Deploying contracts with:", deployer.address);

  // ===============================
  // 1) Deploy helper contracts
  // ===============================

  console.log("➡️ Deploying Milestones...");
  const Milestones = await hre.ethers.getContractFactory("Milestones");
  const milestones = await Milestones.deploy(deployer.address); // temp escrow
  await milestones.waitForDeployment();
  console.log("   Milestones deployed:", await milestones.getAddress());

  console.log("➡️ Deploying GovernanceLight...");
  const Governance = await hre.ethers.getContractFactory("GovernanceLight");
  const governance = await Governance.deploy(deployer.address);
  await governance.waitForDeployment();
  console.log("   Governance deployed:", await governance.getAddress());

  console.log("➡️ Deploying Refunds...");
  const Refunds = await hre.ethers.getContractFactory("Refunds");
  const refunds = await Refunds.deploy(deployer.address);
  await refunds.waitForDeployment();
  console.log("   Refunds deployed:", await refunds.getAddress());

  console.log("➡️ Deploying Treasury...");
  const Treasury = await hre.ethers.getContractFactory("Treasury");
  const treasury = await Treasury.deploy();
  await treasury.waitForDeployment();
  console.log("   Treasury deployed:", await treasury.getAddress());

  // ===============================
  // 2) Deploy PROJECT ESCROW (main)
  // ===============================

  console.log("\n➡️ Deploying ProjectEscrow...");
  const ProjectEscrow = await hre.ethers.getContractFactory("ProjectEscrow");
  const escrow = await ProjectEscrow.deploy(
    await milestones.getAddress(),
    await governance.getAddress(),
    await refunds.getAddress(),
    await treasury.getAddress()
  );
  await escrow.waitForDeployment();
  console.log("   ProjectEscrow deployed:", await escrow.getAddress());

  // ===============================
  // 3) Now wire the escrow address back into helper contracts
  // ===============================

  console.log("\n🔧 Updating helper contracts with ESCROW address...");

  await milestones.setEscrow(await escrow.getAddress());
  await governance.setEscrow(await escrow.getAddress());
  await refunds.setEscrow(await escrow.getAddress());

  console.log("   All helper contracts now trust ProjectEscrow.\n");

  // ===============================
  // 4) Save deployment config
  // ===============================

  const config = {
    network: hre.network.name,
    deployer: deployer.address,
    addresses: {
      ProjectEscrow: await escrow.getAddress(),
      Milestones: await milestones.getAddress(),
      GovernanceLight: await governance.getAddress(),
      Refunds: await refunds.getAddress(),
      Treasury: await treasury.getAddress(),
    },
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    "./deployments.json",
    JSON.stringify(config, null, 2)
  );

  console.log("📁 Saved deployments.json\n");
  console.log("🎉 Deployment complete!");
}

// Run the script
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
