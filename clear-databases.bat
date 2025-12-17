@echo off
echo ========================================
echo Clearing All Databases
echo ========================================
echo.

echo Stopping services (if running)...
echo Please manually stop all running terminals (Ctrl+C)
echo.
pause

echo Clearing backend database...
cd backend
if exist db.sqlite3 (
    del /F db.sqlite3
    echo Backend database deleted.
) else (
    echo Backend database not found.
)
cd ..

echo Clearing indexer database...
cd smartcontract\worker
if exist indexer.sqlite3 (
    del /F indexer.sqlite3
    echo Indexer database deleted.
) else (
    echo Indexer database not found.
)
cd ..\..

echo.
echo ========================================
echo Databases cleared!
echo ========================================
echo.
echo Next steps:
echo 1. Run migrations: cd backend ^&^& python manage.py migrate
echo 2. Restart all services using start-all.bat
echo.
pause
