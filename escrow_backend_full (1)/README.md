# Escrow Backend

This is the Django backend for the Escrow Milestone Funding project. It features a dual-database architecture:
1.  **SQLite**: For standard Django auth, admin, and sessions.
2.  **PostgreSQL**: For the `indexer` app which tracks blockchain state (Projects, Milestones, Pledges).

## Prerequisites

-   Python 3.10+
-   PostgreSQL (Local service running)

## Setup Instructions

### 1. Environment Setup

Naviagte to the backend folder:
```bash
cd "escrow_backend_full (1)"
```

Install dependencies:
```bash
pip install -r requirements.txt
```

### 2. Database Configuration

You must create a PostgreSQL database for the indexer.

**Defaults in `settings.py`:**
-   **DB Name:** `project_escrow`
-   **User:** `postgres`
-   **Password:** `postgres`
-   **Host:** `localhost`
-   **Port:** `5432`

**Create the database:**
```sql
CREATE DATABASE project_escrow;
```
*Ensure your local Postgres user matches the credentials in `backend_core/settings.py` or set the equivalent `INDEXER_DB_*` environment variables.*

### 3. Running Migrations

You must run migrations **twice** due to the dual-database router setup.

1.  **Migrate Default DB (SQLite):**
    ```bash
    python manage.py migrate
    ```

2.  **Migrate Indexer DB (Postgres):**
    ```bash
    python manage.py migrate indexer --database=indexer
    ```

### 4. Running the Server

Start the endpoint:
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/`.

## Troubleshooting

-   **`psycopg2` errors**: If installation fails, try installing the binary version directly: `pip install psycopg2-binary`.
-   **Auth Errors on Migrate**: If `migrate indexer` fails with password authentication errors, check line 132 in `backend_core/settings.py` or your `INDEXER_DB_PASSWORD` environment variable.
