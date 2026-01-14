
const hre = require("hardhat");
async function main() {
    console.log('BLOCK_NUMBER:', await hre.ethers.provider.getBlockNumber());
}
main().catch(console.error);
