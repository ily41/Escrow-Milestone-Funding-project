# Milestone-Based Crowdfunding Backend

Django REST Framework backend for the milestone-based crowdfunding platform.

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Copy environment file:
```bash
cp .env.example .env
```

4. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

5. Create a superuser:
```bash
python manage.py createsuperuser
```

6. Run the development server:
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

## API Documentation

The API documentation is available at:
- **Swagger UI**: `http://localhost:8000/api/docs/`
- **ReDoc**: `http://localhost:8000/api/redoc/`
- **OpenAPI Schema**: `http://localhost:8000/api/schema/`

## API Endpoints

### Authentication
- `POST /api/token/` - Obtain JWT token
- `POST /api/token/refresh/` - Refresh JWT token

### Users
- `POST /api/users/register/` - Register new user
- `GET /api/users/me/` - Get current user info

### Projects
- `GET /api/projects/` - List projects
- `POST /api/projects/` - Create project
- `GET /api/projects/{id}/` - Project details
- `POST /api/projects/{id}/activate/` - Activate project
- `POST /api/projects/{id}/pledge/` - Create pledge
- `GET /api/projects/{id}/stats/` - Project statistics

### Milestones
- `GET /api/projects/milestones/` - List milestones
- `POST /api/projects/milestones/{id}/open-voting/` - Open voting

### Finance
- `GET /api/finance/wallets/` - List user wallets
- `GET /api/finance/pledges/` - List user pledges
- `POST /api/finance/releases/milestone/{id}/` - Release funds
- `POST /api/finance/refunds/` - Request refund

### Governance
- `POST /api/governance/votes/` - Vote on milestone
- `GET /api/governance/audit-logs/` - View audit logs (admin only)

## Testing the API

You can test the API using:
1. **Swagger UI** at `/api/docs/` - Interactive API documentation
2. **ReDoc** at `/api/redoc/` - Alternative API documentation
3. **Postman** or **curl** - Import the OpenAPI schema from `/api/schema/`

## Authentication

Most endpoints require JWT authentication. To authenticate:

1. Get a token by calling `POST /api/token/` with username and password
2. Include the token in the `Authorization` header: `Bearer <your-token>`
3. Use the refresh endpoint to get a new access token when it expires
