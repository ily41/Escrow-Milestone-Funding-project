# How to Run the Backend and Open Swagger

## Step 1: Navigate to Backend Directory
```bash
cd backend
```

## Step 2: Create Virtual Environment (if not already created)
```bash
python -m venv venv
```

## Step 3: Activate Virtual Environment

**On Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**On Windows (Command Prompt):**
```cmd
venv\Scripts\activate
```

**On Mac/Linux:**
```bash
source venv/bin/activate
```

## Step 4: Install Dependencies
```bash
pip install -r requirements.txt
```

## Step 5: Set Up Environment Variables (Optional)
Create a `.env` file in the `backend` directory:
```bash
# Copy the example file
cp .env.example .env
```

Or create `.env` manually with:
```
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DB_ENGINE=sqlite
```

## Step 6: Run Database Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

## Step 7: Create Superuser (Optional - for admin access)
```bash
python manage.py createsuperuser
```

## Step 8: Run the Development Server
```bash
python manage.py runserver
```

The server will start at: `http://localhost:8000`

## Step 9: Open Swagger Documentation

Once the server is running, open your browser and go to:

- **Swagger UI (Interactive)**: http://localhost:8000/api/docs/
- **ReDoc (Alternative)**: http://localhost:8000/api/redoc/
- **OpenAPI Schema (JSON)**: http://localhost:8000/api/schema/

## Quick Start (All Commands at Once)

```bash
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1  # Windows PowerShell
pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

Then open: **http://localhost:8000/api/docs/**

## Testing Authentication in Swagger

1. Go to http://localhost:8000/api/docs/
2. Click the **"Authorize"** button at the top
3. For JWT authentication:
   - First, get a token by calling `POST /api/token/` with username and password
   - Copy the `access` token from the response
   - Click "Authorize" and enter: `Bearer <your-access-token>`
   - Or use the token endpoint directly in Swagger to get authenticated

## Troubleshooting

- **Port already in use**: Change port with `python manage.py runserver 8001`
- **Migration errors**: Run `python manage.py migrate --run-syncdb`
- **Module not found**: Make sure virtual environment is activated and dependencies are installed

