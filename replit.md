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

## Recent Changes (Nov 1, 2025 - Latest Updates)
- **Conversation Health Dashboard**: Analytics dashboard showing relationship health scores, tone distributions, conflict patterns, and time-based insights
- **Cool-Down Timer**: Automatic detection of hostile conversations with guided break suggestions and breathing exercises
- **Voice Message Support**: Record and send voice messages with AI transcription and tone analysis
- **Full URL Routing**: All pages now have shareable URLs for easy link sharing
- **Real-time Tone Analysis**: AI-powered tone detection as users type with 17 different emotional tones
- **I-Statement Generation**: AI modal that intercepts messages and offers constructive I-Statement alternatives
- **Dynamic Color System**: Chat background and input box change colors based on detected message tone
- **Modern Chat UI**: Redesigned chat interface with glass-morphism, animations, and mobile-first design
- **Enhanced API**: Added `/api/analyze-tone`, `/api/generate-i-statement`, and `/api/transcribe-voice` endpoints
- **Fallback Systems**: Local tone analysis when API is unavailable

## Previous Changes (Oct 28, 2025 - Initial Setup)
- Configured frontend to run on port 5000 (Replit requirement)
- Set up dual workflow system (frontend + backend)
- Updated vite.config.js to allow all hosts for iframe proxy support
- Confirmed Supabase credentials are in .env file
- Backend configured to run on localhost:3001
- Replaced react-helmet with react-helmet-async to fix React warnings

## Environment Variables
Located in `.env` file:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `PPLX_API_KEY` - Perplexity AI API key
- `SUPABASE_URL` - Backend Supabase URL
- `SUPABASE_ANON_KEY` - Backend Supabase key

## Key Features

### Analytics Dashboard (NEW!)
- **Health Score**: Overall relationship communication health (0-100)
- **Weekly Progress**: Track improvement trends over time
- **Tone Distribution**: Visual breakdown of emotional tones used
- **Conflict Detection**: Identifies escalation patterns automatically
- **Time Insights**: Peak communication times and conflict patterns
- **Personalized Recommendations**: AI-driven suggestions for improvement

### Cool-Down Timer (NEW!)
- **Automatic Trigger**: Detects when 2+ hostile messages occur in sequence
- **Break Suggestions**: Guided cooldown with breathing exercises
- **Quick Messages**: Send "I need space" with one click
- **Timer Display**: 5-minute countdown for recommended break time

### Voice Messages (NEW!)
- **Browser Recording**: Built-in MediaRecorder API integration
- **Tone Analysis**: Voice messages analyzed for emotional tone
- **Simulated Transcription**: Demo implementation (production requires Whisper API)
- Note: Full speech-to-text requires OpenAI Whisper or similar service integration

### Couples Texting Module
- **Real-time Tone Analysis**: As users type, AI analyzes tone and changes input box color
- **I-Statement Generation**: AI converts potentially confrontational messages into constructive I-Statements
- **17 Emotional Tone Colors**: From calm (blue) to hostile (dark red) with smooth transitions
- **Dynamic Background Colors**: Chat background changes based on message tone, visible to both users
- **Modern Message Bubbles**: Glass-morphism design with animations and mobile-optimized layout
- **Smart Fallbacks**: Local tone analysis when API unavailable, polling when realtime fails
- **Session Management**: Unique 8-character codes for private, secure conversations

### I-Statement Builder
- AI-powered emotion detection (11 emotion categories)
- Emotion tracking with intensity measurement
- Visual emotion timeline and distribution charts
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
