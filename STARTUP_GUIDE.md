# Escrow Milestone Funding Project - Startup Guide

This guide will walk you through starting the entire project from scratch, including backend, frontend, smart contracts, and indexer services.

## Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**
- **pip** (Python package manager)

## Project Structure

```
Escrow-Milestone-Funding-project/
├── backend/          # Django REST API
├── frontend/         # Next.js React application
├── smartcontract/    # Hardhat Ethereum smart contracts
│   └── worker/       # Blockchain indexer service
```

---

## 🚀 Complete Startup Process

### Step 1: Install Dependencies

#### Backend (Django)
```bash
cd backend
pip install -r requirements.txt
```

#### Frontend (Next.js)
```bash
cd frontend
npm install
```

#### Smart Contracts (Hardhat)
```bash
cd smartcontract
npm install
```

#### Worker/Indexer
```bash
cd smartcontract/worker
npm install
```

---

### Step 2: Start Services (In Order)

> [!IMPORTANT]
> Start services in **separate terminal windows** in this exact order:

#### Terminal 1: Start Hardhat Local Blockchain
```bash
cd smartcontract
npx hardhat node
```
**Keep this running** - This is your local Ethereum blockchain.

#### Terminal 2: Deploy Smart Contracts
```bash
cd smartcontract
npx hardhat run scripts/deploy.js --network localhost
```
This creates `deployments.json` with contract addresses.

#### Terminal 3: Start Backend API
```bash
cd backend
python manage.py migrate
python manage.py runserver
```
Backend runs on `http://localhost:8000`

#### Terminal 4: Start Blockchain Indexer
```bash
cd smartcontract/worker
node indexer.js
```
This monitors blockchain events and syncs with the backend database.

#### Terminal 5: Start Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:3000`

---

## 🔄 Restarting the Project

### If You Restart Hardhat Node

> [!WARNING]
> **CRITICAL**: Whenever you restart `npx hardhat node`, you MUST redeploy contracts!

```bash
# Terminal 1: Restart Hardhat
cd smartcontract
npx hardhat node

# Terminal 2: Redeploy contracts
cd smartcontract
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3: Restart indexer (it will resync)
cd smartcontract/worker
node indexer.js
```

The backend and frontend can continue running without restart.

---

## 🗄️ Clearing Databases

### Clear Backend Database (Django)
```bash
cd backend
# Delete the database file
rm db.sqlite3

# Recreate database with migrations
python manage.py migrate

# (Optional) Create superuser
python manage.py createsuperuser
```

### Clear Indexer Database
```bash
cd smartcontract/worker
# Delete the indexer database
rm indexer.sqlite3

# Restart indexer to recreate
node indexer.js
```

### Reset Everything (Nuclear Option)
```bash
# Stop all running services (Ctrl+C in each terminal)

# Clear backend
cd backend
rm db.sqlite3
python manage.py migrate

# Clear indexer
cd ../smartcontract/worker
rm indexer.sqlite3

# Restart Hardhat node (this resets blockchain)
cd ..
# Kill existing hardhat node, then:
npx hardhat node

# In new terminal, redeploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Restart all services in order (see Step 2)
```

---

## 🧪 Testing the Complete Flow

### 1. Create a Project
- Open frontend: `http://localhost:3000`
- Login/Register
- Navigate to Creator Dashboard
- Click "Deploy New Project"
- Fill in details (Goal: 5 ETH, Deadline: future date)
- Submit

### 2. Verify Project Created
- Check frontend: Project should appear in dashboard
- Check backend API: `http://localhost:8000/api/projects/`
- Check indexer logs: Should show "ProjectCreated" event

### 3. Create a Milestone
- In Creator Dashboard, click on your project
- Click "Create Milestone"
- Enter title and amount
- Submit

### 4. Activate Milestone
- Click "Activate" on the milestone
- This allows backers to pledge

### 5. Make a Pledge (as Backer)
- Switch to a different account or use local wallet
- Navigate to the project
- Enter pledge amount
- Submit transaction

---

## 📝 Important Notes

### Contract Addresses
- Contract addresses are stored in `smartcontract/deployments.json`
- Frontend uses hardcoded address: `0x21dF544947ba3E8b3c32561399E88B52Dc8b2823`
- This is the **first deployment address** on Hardhat's deterministic deployment

### Port Configuration
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:8000`
- **Hardhat RPC**: `http://127.0.0.1:8545`

### Environment Variables

#### Backend (.env)
```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
```

#### Smart Contract Worker (.env)
```env
RPC_URL=http://127.0.0.1:8545
CONTRACT_ADDRESS=0x21dF544947ba3E8b3c32561399E88B52Dc8b2823
BACKEND_URL=http://localhost:8000
```

---

## 🐛 Troubleshooting

### "Failed to get on-chain project ID"
- **Cause**: Hardhat node was restarted but contracts weren't redeployed
- **Fix**: Run `npx hardhat run scripts/deploy.js --network localhost`

### Indexer Not Syncing
- Check if Hardhat node is running
- Verify contract address in `worker/.env` matches `deployments.json`
- Check indexer logs for errors

### Backend API Errors
- Ensure migrations are run: `python manage.py migrate`
- Check if backend is running on port 8000
- Verify CORS settings allow frontend origin

### Frontend Connection Issues
- Check if MetaMask/wallet is connected to `http://127.0.0.1:8545`
- Verify contract address in `frontend/lib/web3.ts`
- Clear browser cache and reload

---

## 🎯 Quick Start Script (All-in-One)

Create a file `start-all.sh` (Linux/Mac) or `start-all.bat` (Windows):

### Windows (start-all.bat)
```batch
@echo off
echo Starting Escrow Milestone Funding Project...

start "Hardhat Node" cmd /k "cd smartcontract && npx hardhat node"
timeout /t 5

start "Deploy Contracts" cmd /k "cd smartcontract && npx hardhat run scripts/deploy.js --network localhost"
timeout /t 5

start "Backend" cmd /k "cd backend && python manage.py runserver"
timeout /t 3

start "Indexer" cmd /k "cd smartcontract/worker && node indexer.js"
timeout /t 2

start "Frontend" cmd /k "cd frontend && npm run dev"

echo All services started!
```

### Linux/Mac (start-all.sh)
```bash
#!/bin/bash
echo "Starting Escrow Milestone Funding Project..."

# Start Hardhat node in background
cd smartcontract
npx hardhat node &
sleep 5

# Deploy contracts
npx hardhat run scripts/deploy.js --network localhost
sleep 3

# Start backend
cd ../backend
python manage.py runserver &
sleep 3

# Start indexer
cd ../smartcontract/worker
node indexer.js &
sleep 2

# Start frontend
cd ../../frontend
npm run dev

echo "All services started!"
```

Make executable: `chmod +x start-all.sh`

---

## 📚 Additional Resources

- **Hardhat Docs**: https://hardhat.org/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Django REST Framework**: https://www.django-rest-framework.org/
- **Ethers.js**: https://docs.ethers.org/v6/

---

**Happy Building! 🚀**
