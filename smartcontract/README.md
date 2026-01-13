# Smart Contract (Hardhat)

This directory contains the Solidity smart contracts and the Hardhat environment for compiling, testing, and deploying them.

## Prerequisites

-   Node.js (v18+ recommended)
-   NPM

## Setup

1.  **Install Dependencies:**
    ```bash
    cd smartcontract
    npm install
    # or
    npm ci
    ```
    *Note: This installs Hardhat locally. You should run hardhat commands using `npx hardhat ...`*

2.  **Configuration:**
    -   See `hardhat.config.js` for network settings.
    -   Create a `.env` file if you want to deploy to a live network (Sepolia, etc.) with `RPC_URL` and `PRIVATE_KEY`.

## Usage

### Compile
Compile the contracts to generate artifacts:
```bash
npx hardhat compile
```

### Test
Run the test suite:
```bash
npx hardhat test
```

### Deploy (Localhost)
To deploy to a local Hardhat network:

1.  **Start the Local Node:**
    ```bash
    npx hardhat node
    ```

2.  **Deploy (in a separate terminal):**
    ```bash
    npx hardhat run scripts/deploy.js --network localhost
    ```
    *Make sure to copy the deployed contract address for your frontend/backend configuration.*

### Deploy (Testnet/Sepolia)
Ensure your `.env` is set up, then run:
```bash
npx hardhat run scripts/deploy.js --network sepolia
```