# Couple's Messaging Platform - Replit Configuration

## Project Overview
A sophisticated real-time messaging platform for couples with AI-powered insights, emotion tracking, and sentiment analysis.

## Technology Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Express.js (Node.js)
- **Database**: Supabase (PostgreSQL with real-time)
- **AI**: Perplexity AI for emotion analysis
- **Build Tool**: Vite

## Architecture
- Frontend runs on port 5000 (Vite dev server)
- Backend API runs on port 3001 (Express server)
- Vite proxies `/api/*` requests to the backend

## Recent Changes (Replit Setup - Oct 28, 2025)
- Configured frontend to run on port 5000 (Replit requirement)
- Set up dual workflow system (frontend + backend)
- Updated vite.config.js to allow all hosts for iframe proxy support
- Confirmed Supabase credentials are in .env file
- Backend configured to run on localhost:3001

## Environment Variables
Located in `.env` file:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `PPLX_API_KEY` - Perplexity AI API key
- `SUPABASE_URL` - Backend Supabase URL
- `SUPABASE_ANON_KEY` - Backend Supabase key

## Key Features
- Real-time messaging with automatic fallback to polling
- AI-powered emotion detection (11 emotion categories)
- Emotion tracking with intensity measurement
- Visual emotion timeline and distribution charts
- Session management with unique codes
- Dynamic UI with emotion-based colors

## Development Workflow
1. Backend server starts automatically (node server.js on port 3001)
2. Frontend dev server runs (npm run dev on port 5000)
3. User accesses application through port 5000
4. API calls are proxied from frontend to backend

## User Preferences
- No specific preferences recorded yet

## Notes
- The project has hardcoded Supabase credentials as fallbacks in src/lib/supabase.js
- Vite config already includes `allowedHosts: true` for Replit iframe support
- Frontend must serve on 0.0.0.0:5000 for Replit preview to work
