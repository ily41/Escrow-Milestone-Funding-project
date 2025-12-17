@echo off
echo ========================================
echo Escrow Milestone Funding - Quick Start
echo ========================================
echo.

echo [1/5] Starting Hardhat Node...
start "Hardhat Node" cmd /k "cd smartcontract && npx hardhat node"
timeout /t 8

echo [2/5] Deploying Smart Contracts...
cd smartcontract
call npx hardhat run scripts/deploy.js --network localhost
cd ..
timeout /t 3

echo [3/5] Starting Backend Server...
start "Backend" cmd /k "cd backend && python manage.py runserver"
timeout /t 5

echo [4/5] Starting Blockchain Indexer...
start "Indexer" cmd /k "cd smartcontract\worker && node indexer.js"
timeout /t 3

echo [5/5] Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo All services started successfully!
echo ========================================
echo.
echo Frontend:  http://localhost:3000
echo Backend:   http://localhost:8000
echo Hardhat:   http://127.0.0.1:8545
echo.
echo Press any key to exit...
pause > nul
