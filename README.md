<!-- # Milestone-Based Crowdfunding Platform (Blockchain Integrated)

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
API available at: `http://127.0.0.1:8000/api/docs`

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
 -->


<div align="center">

# 🚀 Milestone-Based Crowdfunding Platform  
### <sup>Blockchain-Powered • Event-Indexed • Full-Stack Escrow System</sup>

![Solidity](https://img.shields.io/badge/Solidity-%23363636.svg?style=for-the-badge&logo=solidity&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20.svg?style=for-the-badge&logo=django&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=nextdotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-%23336791.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Hardhat](https://img.shields.io/badge/Hardhat-FFCC00.svg?style=for-the-badge&logo=ethereum&logoColor=black)

</div>

---

## 🌟 Overview

This is a **milestone-based crowdfunding platform** where the **Smart Contract is the source of truth**.  
Users interact with the blockchain for pledging, voting, releasing funds, and refunds — and an **Indexer** syncs events into PostgreSQL for fast querying.

✔ **Creator launches projects**  
✔ **Backers pledge directly to blockchain**  
✔ **Milestones must be approved to release funds**  
✔ **Indexer listens to on-chain events**  
✔ **Backend exposes API + builds blockchain transactions**  
✔ **Frontend consumes the API + wallet interactions**

---

## 🏗️ Architecture

Frontend (Next.js)
│
Backend API (Django)
│
PostgreSQL ← Indexer (Node.js listens to smart contract events)
↑
Smart Contract (Hardhat / Solidity)

markdown
Copy code

### Components

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Smart Contract** | Solidity, Hardhat | Core escrow logic, holds funds |
| **Indexer** | Node.js, Ethers.js | Listens to events → stores in PostgreSQL |
| **Database** | PostgreSQL | Indexed + query optimized storage |
| **Backend** | Django REST | API + builds blockchain tx payloads |
| **Frontend** | Next.js, Wagmi | User interface |

---

## ⚙️ Features

### 🎯 Creator Features
- Create new projects  
- Define milestone structure  
- Track milestone progress  
- Receive funds after approval  

### 💸 Backer Features
- Pledge using wallet  
- Track project progress  
- Vote on milestone release  
- Request refund when goal is not met  

### 🛠️ Developer Features
- Clean modular smart contracts  
- Indexer with event-based syncing  
- REST API with Swagger UI  
- JWT authentication  
- PostgreSQL multi-database setup  

---

## 🚀 Quick Start

### 1️⃣ Clone the project
```bash
git clone https://github.com/your-user/your-repo.git
cd your-repo
📦 Smart Contract Setup
bash
Copy code
cd smartcontract
npm install
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
🔄 Indexer Setup
bash
Copy code
cd smartcontract/worker
node apply_migrations.js
node indexer.js
🐍 Backend Setup (Django)
bash
Copy code
cd backend
python -m venv venv
venv\Scripts\activate     # Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
Swagger Docs → http://127.0.0.1:8000/api/docs

💻 Frontend Setup (Next.js)
bash
Copy code
cd frontend
npm install
npm run dev
Frontend → http://localhost:3000

🔥 API Endpoints (Important)
Project
GET /api/projects/

POST /api/projects/create/

Milestones
GET /api/projects/{id}/milestones/

POST /api/milestones/{id}/approve/

Pledges
POST /api/projects/{id}/pledge/

Authentication
POST /auth/register/

POST /auth/login/

GET /auth/me/

🧩 Tech Stack
Category	Tech
Frontend	Next.js, Wagmi, Tailwind
Backend	Django REST, PostgreSQL
Smart Contracts	Solidity, Hardhat
Indexer	Node.js, Ethers.js
Auth	JWT, DRF SimpleJWT
Tools	Swagger, GraphQL, Channels

🛡️ Security
Role-based access (Creator / Backer)

Secure JWT auth

Smart contract guards:

Reentrancy protection

Milestone validation

Strict access modifiers

📝 License
MIT — free to modify, improve, and build on.

💙 Credits
Full-stack developer & Web3 enthusiast.

yaml
Copy code





