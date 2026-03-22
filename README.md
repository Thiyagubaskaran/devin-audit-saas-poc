# Retail Audit SaaS - POC

A full-stack retail auditing proof-of-concept application where administrators can create audit templates and auditors can fill and submit audits.

## Tech Stack

- **Frontend**: React (Vite) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Node.js (Express)
- **Database**: SQLite (via better-sqlite3)
- **Storage**: Local filesystem for image uploads

## Features

- JWT-based authentication with bcrypt password hashing
- Role-based access control (Admin / Auditor)
- Audit template management with text, number, and dropdown question types
- Audit execution with dynamic form rendering
- Image upload support for audit evidence
- Dashboard with statistics and charts (Recharts)
- Detailed audit reporting and response viewing

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # or create .env with required vars
npm run dev
```

The backend runs on `http://localhost:8000`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173`.

### Environment Variables

**Backend** (`.env`):
```
PORT=8000
JWT_SECRET=your-secret-key
UPLOAD_DIR=./uploads
```

**Frontend** (`.env`):
```
VITE_API_URL=http://localhost:8000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login

### Templates (Admin)
- `POST /api/templates` - Create template
- `GET /api/templates` - List templates
- `GET /api/templates/:id` - Get template with questions
- `DELETE /api/templates/:id` - Delete template

### Audits
- `POST /api/audits` - Submit an audit (Auditor)
- `POST /api/audits/:id/images` - Upload images for an audit
- `GET /api/audits` - List audits
- `GET /api/audits/:id` - Get audit details
- `GET /api/audits/stats/summary` - Get dashboard stats (Admin)

## User Roles

- **Admin**: Can create/delete templates, view all submitted audits, see dashboard stats
- **Auditor**: Can view templates, submit audits with responses and images, view own audits
