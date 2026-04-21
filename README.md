# WealthFlow

WealthFlow is a React + Express + MongoDB budgeting application with three user roles:

- `basic` users get the core budgeting workflow
- `premium` users also get the Social Hub and challenge participation
- `admin` users can manage users and challenge definitions

## Official Run Path: Docker

From the repo root:

```powershell
docker compose up -d --build
```

App URLs:

- Client: [http://localhost](http://localhost)
- API: [http://localhost:5000](http://localhost:5000)

To stop the stack:

```powershell
docker compose down
```

To stop and remove the Mongo volume:

```powershell
docker compose down -v
```

## Supported Host-Local Setup

1. Copy the example env file into the server folder:

```powershell
Copy-Item .env.example server\.env
```

2. Start MongoDB locally on `mongodb://localhost:27017`.
3. Start the backend:

```powershell
Set-Location server
npm install
npm start
```

4. Start the frontend in a second terminal:

```powershell
Set-Location client
npm install
npm run dev
```

5. Open the Vite app at [http://localhost:5173](http://localhost:5173).

Notes:

- The Vite dev proxy points to `http://localhost:5000`.
- The server loads env vars with `dotenv`, so host-local startup expects `server/.env`.

## Environment Variables

The backend uses:

```env
MONGO_URI=mongodb://localhost:27017/wealthflow
JWT_SECRET=secret
PORT=5000
```

See [.env.example](.env.example).

## Database Overview

The MongoDB `wealthflow` database in this project uses these collections:

- `users`
- `categories`
- `transactions`
- `challenges`
- `challengeparticipations`

## Database Restore

A submission-ready MongoDB dump is committed at:

- `database/mongodump/wealthflow.archive.gz`

Recommended restore path (from repo root, PowerShell):

```powershell
.\database\scripts\restore-dump.ps1
```

If you have MongoDB tools installed locally, this also works:

```powershell
mongorestore --gzip --archive=database\mongodump\wealthflow.archive.gz --uri="mongodb://localhost:27017/wealthflow" --drop
```

Docker fallback for restore:

```powershell
docker run --rm -v "${PWD}/database/mongodump:/dump" mongo:latest mongorestore --gzip --archive=/dump/wealthflow.archive.gz --uri "mongodb://host.docker.internal:27017/wealthflow" --drop
```

## Regenerate Database Dump

The repo includes a deterministic submission seeding workflow plus dump export.

From repo root:

```powershell
.\database\scripts\refresh-dump.ps1
```

What it does:

1. Starts Docker `mongo` service via `docker compose up -d mongo`
2. Seeds a deterministic dataset (`admin`, `premiumuser`, `basicuser`) via `server/scripts/seedSubmissionData.js`
3. Exports `database/mongodump/wealthflow.archive.gz`

Important: refresh uses `RESET_FULL_DATASET=1` to reset and reseed core collections before exporting.

## Test Credentials

Restored dump credentials:

- Admin: username `admin`, password `admin`
- Premium user: username `premiumuser`, password `premium123` (email `premium@wealthflow.com`)
- Basic user: username `basicuser`, password `basic123` (email `basic@wealthflow.com`)

Demo account route remains available:

- Use the `Try Demo Account` button on the login page, or call `POST /api/auth/demo`
- The demo route resets and recreates `demo@demo` / `demo` on demand

## Challenge Feature Status

Challenge participation is implemented as an MVP:

- Premium users can list challenges
- Join and leave challenge records are persisted
- Progress is saved per user per challenge
- Completing a challenge sets progress to `100%` and marks it complete

Progress is manual in this version. It is not derived automatically from transaction activity.

## Manual Verification Checklist

1. Sign in as `premiumuser` and confirm `Social Hub` and `Challenges` are visible.
2. Open `Challenges`, join a challenge, update progress, refresh, and verify progress persists.
3. Sign in as `basicuser` and confirm premium-only nav items are hidden.
4. Verify the basic user cannot access `GET /api/challenges` successfully.
5. Add, edit, and delete a transaction from the dashboard.
6. Open `Categories`, edit a category name, and verify analytics/transactions still resolve.
7. Open `Settings` and toggle between Basic and Premium.
8. Sign in as `admin` and verify user deletion plus challenge CRUD.

## Submission Artifacts

- Mongo dump: [database/mongodump/wealthflow.archive.gz](database/mongodump/wealthflow.archive.gz)
- Deterministic seed script: [server/scripts/seedSubmissionData.js](server/scripts/seedSubmissionData.js)
- Dump refresh script: [database/scripts/refresh-dump.ps1](database/scripts/refresh-dump.ps1)
- Dump restore script: [database/scripts/restore-dump.ps1](database/scripts/restore-dump.ps1)
