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
Built with ❤️ by Rauf İlyayi
Full-stack developer & Web3 enthusiast.
