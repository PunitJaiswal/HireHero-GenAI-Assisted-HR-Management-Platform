# Vercel Deployment Guide

## Overview

This project is configured as a monorepo for Vercel:
- **Frontend** (React/Vite) → built as static files, served at `/`
- **Backend** (Flask/Python) → serverless functions, served at `/api/*`

## Prerequisites

- A [Vercel account](https://vercel.com)
- A cloud PostgreSQL database — free options:
  - [Neon](https://neon.tech) ← recommended (Vercel-native integration)
  - [Supabase](https://supabase.com)
  - [Railway](https://railway.app)

## Step 1: Set up the Database

1. Create a free PostgreSQL database on Neon or Supabase
2. Copy the connection string — it looks like:
   `postgresql://user:password@host/dbname`

## Step 2: Push to GitHub

```bash
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

## Step 3: Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. **Framework Preset**: Other (auto-detected)
4. **Root Directory**: leave as `/` (the repo root)
5. Click **Add Environment Variables** and add all variables from the table below
6. Click **Deploy**

## Required Environment Variables

| Variable | Description | Example |
|---|---|---| 
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `SECRET_KEY` | Flask session secret (any random string) | `your-random-secret-key-here` |
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `GROQ_API_KEY` | Groq API key (fallback LLM) | `gsk_...` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `....apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | `GOCSPX-...` |
| `VERCEL` | Set to `1` to enable /tmp file storage | `1` |

Get API keys:
- **Gemini**: https://aistudio.google.com/app/apikey
- **Groq**: https://console.groq.com/keys
- **Google OAuth**: https://console.cloud.google.com → APIs & Services → Credentials

## Step 4: Update Google OAuth Redirect URI

After your first deploy, Vercel gives you a URL like `https://your-project.vercel.app`.

Go to [Google Cloud Console](https://console.cloud.google.com) → Your OAuth App → Authorized redirect URIs → Add:
```
https://your-project.vercel.app/api/auth/google/callback
```

## Important Limitations on Vercel

**File uploads are ephemeral** — Vercel's serverless functions only allow writes to `/tmp`, which is cleared between invocations. This means uploaded profile pictures and resumes won't persist across sessions.

To support persistent file storage, integrate a cloud storage service:
- [Cloudinary](https://cloudinary.com) — easy, free tier available
- [AWS S3](https://aws.amazon.com/s3/)
- [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)

## Local Development (unchanged)

```bash
# Backend
cd backend
pip install -r requirements.txt
# Create .env with DATABASE_URL, SECRET_KEY, GEMINI_API_KEY, etc.
python run.py

# Frontend
cd frontend
npm install
npm run dev
```
