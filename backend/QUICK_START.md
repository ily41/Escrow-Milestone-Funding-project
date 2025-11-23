# Quick Start Guide

## Setup (One-time)

1. **Activate virtual environment:**
   ```powershell
   cd backend
   .\venv\Scripts\Activate.ps1
   ```

2. **Install dependencies (if not done):**
   ```powershell
   pip install -r requirements.txt
   ```

3. **Run migrations:**
   ```powershell
   python manage.py migrate
   ```

4. **Create superuser (if needed):**
   ```powershell
   python create_superuser.py
   ```
   Default credentials:
   - Username: `admin`
   - Password: `admin123`

## Running the Server

```powershell
cd backend
.\venv\Scripts\Activate.ps1
python manage.py runserver
```

Server will start at: **http://localhost:8000**

## Access Points

- **Django Admin**: http://localhost:8000/admin/login/
  - Username: `admin`
  - Password: `admin123`

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

## What You Can Do in Django Admin

1. **View and manage:**
   - Users (custom user model)
   - Creators
   - Projects
   - Milestones
   - Pledges
   - Votes
   - Releases
   - Refunds
   - Wallets
   - Updates
   - Audit Logs

2. **Create test data:**
   - Create users and creators
   - Create projects with milestones
   - View all database records

## Troubleshooting

**If you get "no such table" errors:**
```powershell
# Delete database and recreate
Remove-Item db.sqlite3
python manage.py migrate
python create_superuser.py
```

**If migrations are inconsistent:**
```powershell
Remove-Item db.sqlite3
python manage.py makemigrations
python manage.py migrate
python create_superuser.py
```

