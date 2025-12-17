# Escrow Milestone Funding Project

A decentralized crowdfunding platform with milestone-based funding, community governance, and secure escrow.

## 🚀 Quick Start

### Option 1: Use the Startup Script (Recommended)
```bash
# Windows
start-all.bat

# This will automatically:
# 1. Start Hardhat node
# 2. Deploy contracts
# 3. Start backend
# 4. Start indexer
# 5. Start frontend
```

### Option 2: Manual Start
See [STARTUP_GUIDE.md](./STARTUP_GUIDE.md) for detailed instructions.

## 📁 Project Structure

```
Escrow-Milestone-Funding-project/
├── backend/              # Django REST API
│   ├── manage.py
│   └── db.sqlite3       # SQLite database
├── frontend/            # Next.js application
│   ├── app/
│   ├── components/
│   └── lib/
├── smartcontract/       # Hardhat smart contracts
│   ├── contracts/
│   ├── scripts/
│   ├── deployments.json # Contract addresses
│   └── worker/          # Blockchain indexer
│       └── indexer.js
├── STARTUP_GUIDE.md     # Detailed startup instructions
├── start-all.bat        # Quick start script
└── clear-databases.bat  # Database reset script
```

## 🔄 Clearing Databases & Restarting

### Step 1: Stop All Services
Press `Ctrl+C` in each terminal running:
- Hardhat node
- Backend server
- Indexer
- Frontend

### Step 2: Clear Databases
```bash
# Option A: Use the script
clear-databases.bat

# Option B: Manual
cd backend
del db.sqlite3
python manage.py migrate

cd ../smartcontract/worker
del indexer.sqlite3
```

### Step 3: Restart Everything
```bash
start-all.bat
```

## 🌐 Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
- **Hardhat RPC**: http://127.0.0.1:8545

## 📚 Documentation

- [STARTUP_GUIDE.md](./STARTUP_GUIDE.md) - Complete startup instructions
- [Smart Contract Docs](./smartcontract/README.md) - Contract documentation
- [API Docs](./backend/README.md) - Backend API documentation

## ⚠️ Important Notes

> **CRITICAL**: Whenever you restart the Hardhat node, you MUST redeploy contracts!

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Otherwise, the frontend will point to non-existent contract addresses.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16, React 19, TailwindCSS, Ethers.js
- **Backend**: Django, Django REST Framework, SQLite
- **Smart Contracts**: Solidity, Hardhat, Ethers.js
- **Indexer**: Node.js, SQLite

## 📝 License

MIT

---

**For detailed instructions, see [STARTUP_GUIDE.md](./STARTUP_GUIDE.md)**
