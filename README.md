# 🚀 Milestone-Based Crowdfunding Platform
# Blockchain-Powered • Event-Indexed • Full-Stack Escrow System

<div align="center">

![Solidity](https://img.shields.io/badge/Solidity-%23363636.svg?style=for-the-badge&logo=solidity&logoColor=white)
![Django](https://img.shields.io/badge/Django-092E20.svg?style=for-the-badge&logo=django&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=nextdotjs&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-%23336791.svg?style=for-the-badge&logo=postgresql&logoColor=white)
![Hardhat](https://img.shields.io/badge/Hardhat-FFCC00.svg?style=for-the-badge&logo=ethereum&logoColor=black)

</div>

---

## 🌟 Overview

This is a **milestone-based crowdfunding platform** where the **Smart Contract is the source of truth**.

✔ Creators launch projects  
✔ Backers pledge directly to blockchain  
✔ Milestones must be approved to release funds  
✔ Indexer listens to contract events and updates PostgreSQL  
✔ Backend provides REST API + builds blockchain transactions  
✔ Frontend interacts with Wallet + API  

---

## 🏗️ Architecture (High-Level)

Frontend (Next.js)
│
Backend API (Django)
│
PostgreSQL ← Indexer (Node.js listens to events)
↑
Smart Contract (Solidity / Hardhat)

yaml
Copy code

### 🔧 Components

| Layer | Technology | Purpose |
|-------|------------|---------|
| Smart Contract | Solidity, Hardhat | Escrow logic + milestones |
| Indexer | Node.js, Ethers.js | Sync blockchain events → DB |
| Database | PostgreSQL | Indexed, normalized project data |
| Backend | Django REST | API + JWT + transaction builder |
| Frontend | Next.js, Wagmi | Wallet UI + app interface |

---

## ⚙️ Features

### 🎯 Creator Features
- Create project  
- Add milestones  
- Receive funds after milestone approval  
- Monitor pledges  

### 💸 Backer Features
- Pledge ETH  
- Vote to approve milestones  
- Track pledge history  
- Refund if project fails  

### 🛠 Developer Features
- Modular smart contracts  
- Node.js event indexer  
- PostgreSQL multi-database config  
- Swagger UI for API  
- Clean REST architecture  

---

## 🚀 Quick Start

### 1️⃣ Clone Project
```bash
git clone https://github.com/your-user/your-repo.git
cd your-repo
📦 Smart Contracts (Hardhat)
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
venv\Scripts\activate    # Windows
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

🔥 API Endpoints
📁 Projects
GET /api/projects/

POST /api/projects/create/

📌 Milestones
GET /api/projects/{id}/milestones/

POST /api/milestones/{id}/approve/

💸 Pledges
POST /api/projects/{id}/pledge/

🔐 Authentication
POST /auth/register/

POST /auth/login/

GET /auth/me/

🧩 Tech Stack
Category	Technologies
Frontend	Next.js, Wagmi, Tailwind
Backend	Django REST, PostgreSQL
Smart Contracts	Solidity, Hardhat
Indexer	Node.js, Ethers.js
Auth	JWT, SimpleJWT
Tools	Swagger, GraphQL

🛡️ Security
JWT Authentication

Role-based access (Creator / Backer)

Contract-level protection:

Reentrancy guards

Access modifiers

Milestone verification

📝 License
MIT — free to modify and use.
