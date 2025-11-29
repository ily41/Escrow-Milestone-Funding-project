# Milestone-Based Crowdfunding Platform (Blockchain Integrated)

A full-stack web application for milestone-based crowdfunding where the **Smart Contract is the Source of Truth**.
Backers pledge funds directly to a Smart Contract. An Indexer syncs these events to a PostgreSQL database, which the Django Backend serves to the Frontend.

## Architecture

1.  **Smart Contract (Hardhat)**: Handles business logic (Pledge, Vote, Release, Refund) and holds funds.
2.  **Indexer (Node.js)**: Listens to Blockchain events and updates the PostgreSQL database.
3.  **Database (PostgreSQL)**: Stores synced data for fast querying by the Backend.
4.  **Backend (Django)**: Read-only API for project data (from DB) + Write API to construct Blockchain transactions.
5.  **Frontend (Next.js)**: User interface.

## Prerequisites

-   **Node.js** (v18+)
-   **Python** (v3.10+)
-   **PostgreSQL** (running on localhost:5432)

## Quick Start Guide

### 1. Database Setup
Ensure PostgreSQL is running.
-   **User**: `postgres`
-   **Password**: `postgres`
-   **Database**: `project_escrow` (will be created automatically if missing)

### 2. Smart Contract & Indexer
Navigate to `smartcontract/`:
```bash
cd smartcontract
npm install
```

**Terminal 1: Start Blockchain Node**
```bash
npx hardhat node
```

**Terminal 2: Deploy & Start Indexer**
```bash
# Deploy contract to local node
npx hardhat run scripts/deploy.js --network localhost

# Run DB migrations
node worker/apply_migrations.js

# Start the Indexer
node worker/indexer.js
```

### 3. Backend Setup
Navigate to `backend/`:
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
```

**Terminal 3: Start Backend Server**
```bash
python manage.py runserver
```
API available at: `http://127.0.0.1:8000/api/`

### 4. Frontend Setup
Navigate to `frontend/`:
```bash
cd frontend
npm install
```

**Terminal 4: Start Frontend**
```bash
npm run dev
```
App available at: `http://localhost:3000`

## Key Workflows

-   **Create Project**: Frontend calls Backend -> Backend sends `createProject` tx to Blockchain -> Indexer sees `ProjectCreated` -> DB updated.
-   **Pledge**: Frontend calls Backend -> Backend sends `pledge` tx -> Indexer sees `PledgeMade` -> DB updated.
-   **Vote**: Frontend calls Backend -> Backend sends `voteOnMilestone` tx -> Indexer sees `VoteCast` -> DB updated.

## API Endpoints

-   `GET /api/projects/`: List projects (from DB).
-   `POST /api/projects/`: Create project (on Blockchain).
-   `POST /api/projects/{id}/pledge/`: Pledge to project (on Blockchain).
-   `POST /api/milestones/{id}/approve/`: Vote to approve milestone (on Blockchain).
