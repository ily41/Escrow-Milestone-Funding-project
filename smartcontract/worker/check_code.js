const { ethers } = require("ethers");

async function main() {
    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
    const address = "0x2279B7A0a67DB372996a5FaB50D91eAA73d2eBe6";

    console.log("Checking code at:", address);
    try {
        const code = await provider.getCode(address);
        console.log("Code length:", code.length);
        if (code === "0x") {
            console.log("WARNING: No code found at address. Contract likely not deployed or incorrect address.");
        } else {
            console.log("Success: Code found.");
        }
    } catch (err) {
        console.error("Error connecting to provider:", err.message);
    }
}

main();
