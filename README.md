# Thursday Soccer ⚽

A mobile-first web app for managing weekly Thursday night soccer teams.

## Features
- Player roster management
- Weekly attendance selection
- Automatic balanced team generation (skill, age, nationality)
- Drag-and-drop player swapping between teams
- WhatsApp team sharing
- Multi-manager login via Supabase Auth

## Setup Instructions

### 1. Run the database schema
- Go to your Supabase project → SQL Editor → New query
- Paste the contents of `schema.sql` and click Run

### 2. Configure environment variables
The `.env.local` file is already configured with your Supabase credentials.

### 3. Install and run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000

### 4. Deploy to Vercel
1. Push this folder to a GitHub repository
2. Go to vercel.com → New Project → import your GitHub repo
3. Under Environment Variables, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
4. Click Deploy

## Tech Stack
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (database + auth)
- Vercel (hosting)
