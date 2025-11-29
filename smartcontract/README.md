# Sprint 2 — Milestone-Based Crowdfunding (Escrow)

This project contains:

- Solidity smart contract: ProjectEscrow.sol  
- Hardhat tests  
- Deployment script  
- Indexer (event listener)  
- Backfill script  
- Postgres SQL schema + materialized view  

## Architecture

User → Smart Contract → Emits Events → Worker/ETL → PostgreSQL → Materialized View

## Commands

Install:
npm install

Compile:
npx hardhat compile

Test:
npx hardhat test

Deploy:
npm run deploy:sepolia

Indexer:
npm run worker

Backfill:
npm run backfill