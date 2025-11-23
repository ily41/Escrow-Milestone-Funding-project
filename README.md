# Milestone-Based Crowdfunding Platform

A full-stack web application for milestone-based crowdfunding with escrow functionality. Backers pledge funds to projects, and money is held in escrow and released per milestone after community approval through voting.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Django 4.2, Django REST Framework
- **Database**: PostgreSQL (or SQLite for development)
- **Authentication**: JWT (JSON Web Tokens)

## Project Structure

```
.
├── backend/          # Django backend
│   ├── config/      # Django settings
│   ├── users/       # User and creator models
│   ├── projects/    # Projects and milestones
│   ├── finance/     # Wallets, pledges, releases, refunds
│   └── governance/  # Voting and audit logs
├── frontend/        # Next.js frontend
│   ├── app/         # App Router pages
│   ├── components/  # React components
│   └── lib/         # API client and types
└── README.md
```

## Quick Start

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your settings
```

5. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

6. Create superuser:
```bash
python manage.py createsuperuser
```

7. Run development server:
```bash
python manage.py runserver
```

Backend API will be available at `http://localhost:8000/api/`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Update `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

5. Run development server:
```bash
npm run dev
```

Frontend will be available at `http://localhost:3000`

## Features

### Core Functionality

1. **Project Creation**: Creators can create projects with milestones
2. **Pledging**: Backers can pledge funds to active projects
3. **Milestone Voting**: Backers vote on milestone completion
4. **Fund Release**: Approved milestones trigger fund releases
5. **Refunds**: Backers can request refunds for failed milestones
6. **Project Updates**: Creators can post updates to their projects

### User Roles

- **Creator**: Create and manage projects, define milestones, post updates
- **Backer**: Pledge funds, vote on milestones, request refunds
- **Admin**: System administration and audit log access

## API Endpoints

### Authentication
- `POST /api/token/` - Login
- `POST /api/token/refresh/` - Refresh token
- `POST /api/users/register/` - Register

### Projects
- `GET /api/projects/` - List projects
- `POST /api/projects/` - Create project
- `GET /api/projects/{id}/` - Project details
- `POST /api/projects/{id}/activate/` - Activate project
- `POST /api/projects/{id}/pledge/` - Create pledge

### Milestones
- `GET /api/projects/milestones/` - List milestones
- `POST /api/projects/milestones/` - Create milestone
- `POST /api/projects/milestones/{id}/open_voting/` - Open voting

### Finance
- `GET /api/finance/wallets/` - List wallets
- `GET /api/finance/pledges/` - List pledges
- `POST /api/finance/releases/milestone/{id}/` - Release funds
- `POST /api/finance/refunds/` - Request refund

### Governance
- `POST /api/governance/votes/` - Vote on milestone
- `GET /api/governance/audit-logs/` - View audit logs (admin)

## Development Notes

- The escrow logic is simulated in Django (not actual blockchain)
- Voting uses simple majority rule (approve > reject)
- Refunds are processed automatically when milestones are rejected
- Wallet balances are updated when funds are released or refunded

## License

This is a university course project.


