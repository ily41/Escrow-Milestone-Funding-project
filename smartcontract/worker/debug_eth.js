require("dotenv").config({ path: __dirname + "/../.env" });
const { ethers } = require("ethers");

console.log("RPC_URL:", process.env.RPC_URL);
console.log("PRIVATE_KEY length:", process.env.PRIVATE_KEY ? process.env.PRIVATE_KEY.length : "undefined");
console.log("PRIVATE_KEY:", process.env.PRIVATE_KEY);

try {
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
    console.log("Wallet address:", wallet.address);
} catch (error) {
    console.error("Error creating wallet:", error);
}
