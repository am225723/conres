# Couple's Messaging Platform - Replit Configuration

## Project Overview
A sophisticated real-time messaging platform for couples with AI-powered insights, emotion tracking, and sentiment analysis. Mobile web app ready with Supabase-only architecture.

## Technology Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL with real-time + Edge Functions)
- **Database**: Supabase PostgreSQL with conres_ prefixed tables (lowercase)
- **AI**: Supabase Edge Functions calling Perplexity API
- **Build Tool**: Vite

## Architecture
- Frontend-only architecture (no Express backend)
- Frontend runs on port 5000 (Vite dev server)
- All data operations use Supabase client directly
- AI features use Supabase Edge Functions (tone-analyze, generate-i-statement)
- Real-time messaging via Supabase realtime subscriptions
- Database tables prefixed with conres_ (lowercase for PostgreSQL compatibility)

## Recent Changes (Dec 8, 2025 - Major Feature Expansion)

### NEW: AI Conversational I-Statement Builder (`/ai-builder`)
- Conversational chat interface for building I-Statements
- AI asks follow-up questions to understand emotions and needs
- Generates properly formatted I-Statements
- Copy and save functionality
- Located at: `src/components/AIStatementBuilder.jsx`

### NEW: Healing Animation System (`/emotions`)
- Interactive healing journey visualization
- Emotion-specific color themes and animations
- Multi-phase healing process with affirmations
- AI-generated personalized affirmations
- Located at: `src/components/HealingAnimation.jsx`
- Integrated into: `src/components/EmotionsTab.jsx`

### NEW: AI Role-Playing Partner (`/ai-roleplay`)
- Practice conversations with AI partner
- 5 partner personality styles (supportive, defensive, dismissive, avoidant, anxious)
- Custom scenario input
- Session saving capability
- Located at: `src/components/AIRolePlayer.jsx`

### NEW: Analytics Dashboard (`/analytics`)
- Session statistics (couples sessions, messages, I-statements, role-play)
- Weekly activity chart
- Tone distribution visualization
- Quick stats overview
- Located at: `src/components/AnalyticsDashboard.jsx`

### NEW: Additional Database Tables
- `conres_istatement_history` - Stores AI-built I-statements
- `conres_roleplay_sessions` - Stores role-play sessions
- `conres_emotion_tracking` - Stores emotion exploration sessions
- `conres_user_progress` - Tracks overall user progress
- SQL file: `supabase-additional-tables.sql`

## Previous Changes (Dec 7, 2025 - Supabase Edge Functions)
- **Supabase Edge Functions**: Deployed serverless functions for AI features
  - `tone-analyze` - Perplexity AI-powered tone analysis with 17 emotional tones
  - `generate-i-statement` - Perplexity AI-powered I-Statement generation
- **Database Tables**: All tables prefixed with conres_ (lowercase)
- **Secure API Keys**: PPLX_API_KEY stored in Supabase secrets, not exposed to client
- **Session Codes**: 6-digit numeric codes for easier sharing

## Previous Changes (Dec 1, 2025 - Supabase Migration)
- **MAJOR: Removed Express Backend**: Complete migration to Supabase-only architecture
- **Direct Supabase Calls**: All session/message operations use Supabase client
- **Removed Dependencies**: Express, cors, dotenv, multer, node-fetch, pusher removed
- **Mobile Ready**: Architecture optimized for mobile web app deployment

## Environment Variables
Located in Replit Secrets (override .env file):
- `VITE_SUPABASE_URL` - Supabase project URL (efgtznvrnzqcxmfmjuue.supabase.co)
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_PPLX_API_KEY` - Perplexity AI API key (for tone analysis and I-statement generation)

**Note**: Replit Secrets take precedence over .env file values

## Navigation Routes
- `/` - I-Statement Builder (manual)
- `/ai-builder` - AI Conversational I-Statement Builder
- `/emotions` - Emotion Explorer with Healing Animation
- `/roleplay` - Manual Role-Play
- `/ai-roleplay` - AI Partner Role-Play Practice
- `/couples` - Real-time Couples Messaging
- `/analytics` - Analytics Dashboard
- `/exercises` - Communication Exercises
- `/journal` - Personal Journal
- `/history` - Statement History

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

### AI Conversational I-Statement Builder (NEW!)
- **Chat Interface**: Natural conversation with AI coach
- **Follow-up Questions**: AI asks clarifying questions about emotions and needs
- **Smart Generation**: Creates properly formatted I-statements
- **Save & Copy**: Store statements for future reference

### Healing Animation (NEW!)
- **Emotion-Based Visualization**: Colors match selected emotions
- **Multi-Phase Journey**: 5-step healing process
- **AI Affirmations**: Personalized based on emotions and needs
- **Session Tracking**: Saves completed healing sessions

### AI Partner Practice (NEW!)
- **5 Personality Types**: Supportive, Defensive, Dismissive, Avoidant, Anxious
- **Custom Scenarios**: Practice specific situations
- **Realistic Responses**: AI adapts to your communication style
- **Progress Tracking**: Review past practice sessions

### Analytics Dashboard (NEW!)
- **Session Metrics**: Track all platform usage
- **Weekly Activity**: Visual progress over time
- **Tone Analysis**: See communication patterns
- **Quick Insights**: Key statistics at a glance

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
- Database table names must be lowercase (PostgreSQL behavior)
