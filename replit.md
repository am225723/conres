# Couple's Messaging Platform - Replit Configuration

## Project Overview
A sophisticated real-time messaging platform for couples with AI-powered insights, emotion tracking, and sentiment analysis. Mobile web app ready with Supabase-only architecture.

## Technology Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL with real-time) - No Express server
- **Database**: Supabase (PostgreSQL with real-time subscriptions)
- **AI**: Local keyword-based analysis with optional Supabase Edge Function support
- **Build Tool**: Vite

## Architecture
- Frontend-only architecture (no Express backend)
- Frontend runs on port 5000 (Vite dev server)
- All data operations use Supabase client directly
- AI functions use local analysis with fallbacks
- Real-time messaging via Supabase realtime subscriptions

## Recent Changes (Dec 1, 2025 - Supabase Migration)
- **MAJOR: Removed Express Backend**: Complete migration to Supabase-only architecture
- **AI Service Refactor**: Created src/lib/aiService.js with LOCAL-ONLY implementations (no external API calls for security)
  - `analyzeTone()` - Keyword-based tone analysis
  - `generateIStatement()` - Rule-based I-Statement generation  
  - `transcribeVoice()` - Simulated transcription (placeholder for future API)
  - `callAI()` - Local response generation with pattern matching
- **Security Fix**: Removed all external API calls from client to prevent key exposure
- **Direct Supabase Calls**: All session/message operations use Supabase client
- **Removed Proxy**: Vite config no longer proxies to backend server
- **Removed Dependencies**: Express, cors, dotenv, multer, node-fetch, pusher removed
- **Session Codes**: Changed from 8-character to 6-digit format for easier sharing
- **Mobile Ready**: Architecture optimized for mobile web app deployment

## Previous Updates (Nov 1, 2025)
- Conversation Health Dashboard with analytics
- Cool-Down Timer for hostile conversation detection
- Voice Message Support with tone analysis
- Full URL Routing for shareable links
- Real-time Tone Analysis with 17 emotional tones
- I-Statement Generation modal
- Dynamic Color System based on message tone

## Environment Variables
Located in Replit Secrets (override .env file):
- `VITE_SUPABASE_URL` - Supabase project URL (efgtznvrnzqcxmfmjuue.supabase.co)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `PPLX_API_KEY` - Perplexity AI API key (optional, for enhanced AI)

**Note**: Replit Secrets take precedence over .env file values

## Shareable Session Links

The Couples Texting feature now supports direct shareable links:

- **Format**: `https://your-app.replit.dev/couples/SESSION_CODE`
- **How to Share**:
  1. Create a new session by entering your nickname and clicking "Create New Session"
  2. The shareable link is **automatically copied to your clipboard**
  3. Share this link with your partner via text, email, or any messaging app
  4. Your partner can click the link to join directly (or enter the session code manually)
- **Copy Link Button**: Click the "Invite Partner" button in any active chat to re-copy the link
- **No More 404 Errors**: Refreshing the page now works correctly on all routes

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
- **Session Management**: Unique 6-digit codes for private, secure conversations

### I-Statement Builder
- AI-powered emotion detection (11 emotion categories)
- Emotion tracking with intensity measurement
- Visual emotion timeline and distribution charts
- Dynamic UI with emotion-based colors

## Development Workflow
1. Frontend dev server runs (npm run dev on port 5000)
2. User accesses application through port 5000
3. All data operations use Supabase client directly (no backend proxy)
4. Real-time updates via Supabase subscriptions

## User Preferences
- No specific preferences recorded yet

## Notes
- The project has hardcoded Supabase credentials as fallbacks in src/lib/supabase.js
- Vite config already includes `allowedHosts: true` for Replit iframe support
- Frontend must serve on 0.0.0.0:5000 for Replit preview to work
