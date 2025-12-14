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

## Recent Changes (Dec 8, 2025 - Major UI & Feature Reorganization)

### UPDATED: AI I-Statement Builder is now Main Page
- `/` now displays the combined AI I-Statement Builder (was `/ai-builder`)
- **Two input modes**:
  1. **Express Freely** - Write raw, unfiltered thoughts about what you want to say
  2. **Structured** - Fill in form fields (I feel, When, Because, Could we)
- AI transforms either input into healthy I-Statements
- **Verification step** - After generation, AI asks "Does this capture what you wanted to say?"
- Users can refine through chat conversation with the AI
- Copy and save functionality

### UPDATED: AI Practice Partner - Multi-Scenario Support
- Now supports practicing with different relationship types:
  - Romantic Partner
  - Close Friend
  - Coworker
  - Manager/Supervisor
  - Family Member
- 5 response styles (Supportive, Defensive, Dismissive, Avoidant, Anxious)
- Each relationship type gets AI-tailored responses
- Session saving with relationship type and personality style tracking
- **Removed**: Old manual Role-Play option

### UPDATED: Journal Auto-Saves to Dashboard
- Journal entries now automatically save to Supabase database
- Entries display in the Conversation Dashboard as "Recent Journal Reflections"
- Dashboard shows last 5 journal entries with dates
- Entries persist across sessions (requires `conres_journal_entries` table)

### UPDATED: Navigation Structure
- Removed duplicate "Builder" and "Role-Play" options
- Cleaner sidebar with 8 main sections:
  1. Builder (AI I-Statement Builder)
  2. Emotions
  3. AI Practice (replaces Role-Play)
  4. Couples
  5. Analytics
  6. Exercises
  7. Journal
  8. History

### UPDATED: Conversation Dashboard
- Now includes recent journal reflections section
- Shows last 5 journal entries with dates
- Displays alongside message analytics and tone distribution
- Provides comprehensive view of user's communication journey

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
- `/` - AI I-Statement Builder (Express Freely or Structured mode)
- `/emotions` - Emotion Explorer with Healing Animation
- `/ai-roleplay` - AI Practice Partner (romantic, friend, coworker, manager, family)
- `/couples` - Real-time Couples Messaging
- `/analytics` - Analytics Dashboard with message health scores
- `/exercises` - Communication Exercises
- `/journal` - Personal Journal (auto-saves to database)
- `/history` - Statement History
- `/dashboard` - Conversation Dashboard (message analytics + journal reflections)

## Key Features

### AI I-Statement Builder (Main Page)
- **Express Freely Mode**: Write exactly what you're feeling without holding back
- **Structured Mode**: Fill in I feel → When → Because → Could we format
- **AI Transformation**: Converts raw thoughts into constructive I-Statements
- **Verification**: AI asks if statement captures your intent
- **Chat Refinement**: Iteratively improve statements through conversation
- **Save & Copy**: Store for later reference

### AI Practice Partner
- **Multiple Scenarios**: Practice with partners, friends, coworkers, managers, family
- **5 Personality Types**: Supportive, Defensive, Dismissive, Avoidant, Anxious
- **Relationship-Aware**: AI responses change based on relationship type
- **Custom Scenarios**: Describe specific situations to practice
- **Session Saving**: Save practice sessions for review

### Journal with Dashboard Integration
- **Auto-Save**: Entries automatically saved to Supabase
- **Dashboard View**: Recent reflections appear in Conversation Dashboard
- **Persistent Storage**: Access entries across sessions
- **Communication Tracking**: Integrate journaling with message analytics

### Healing Animation
- **Emotion-Based Visualization**: Colors match selected emotions
- **Multi-Phase Journey**: 5-step healing process
- **AI Affirmations**: Personalized based on emotions and needs
- **Session Tracking**: Saves completed healing sessions

### Analytics Dashboard
- **Session Metrics**: Track all platform usage
- **Weekly Activity**: Visual progress over time
- **Tone Analysis**: See communication patterns
- **Journal Reflections**: View recent journal entries
- **Quick Insights**: Key statistics at a glance

### Couples Texting Module
- **Real-time Tone Analysis**: As users type, AI analyzes tone and changes input box color
- **I-Statement Generation**: AI converts potentially confrontational messages into constructive I-Statements
- **17 Emotional Tone Colors**: From calm (blue) to hostile (dark red) with smooth transitions
- **Dynamic Background Colors**: Chat background changes based on message tone, visible to both users
- **Modern Message Bubbles**: Glass-morphism design with animations and mobile-optimized layout
- **Smart Fallbacks**: Local tone analysis when API unavailable, polling when realtime fails
- **Session Management**: Unique 6-digit codes for private, secure conversations

## Database Tables Required

For full functionality, create these tables in Supabase:

```sql
-- Journal entries
CREATE TABLE conres_journal_entries (
  id BIGSERIAL PRIMARY KEY,
  entry_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- I-Statement history
CREATE TABLE conres_istatement_history (
  id BIGSERIAL PRIMARY KEY,
  original_message TEXT,
  final_statement TEXT NOT NULL,
  conversation JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Role-play sessions
CREATE TABLE conres_roleplay_sessions (
  id BIGSERIAL PRIMARY KEY,
  scenario TEXT NOT NULL,
  relationship_type VARCHAR(50),
  partner_style VARCHAR(50),
  conversation JSONB,
  message_count INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Emotion tracking
CREATE TABLE conres_emotion_tracking (
  id BIGSERIAL PRIMARY KEY,
  emotions JSONB,
  affirmation TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User progress
CREATE TABLE conres_user_progress (
  id BIGSERIAL PRIMARY KEY,
  total_statements INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Development Workflow
1. Frontend dev server runs (npm run dev on port 5000)
2. User accesses application through port 5000
3. All data operations use Supabase client directly (no backend proxy)
4. Real-time updates via Supabase subscriptions
5. Journal entries automatically persist to database

## User Preferences
- No specific preferences recorded yet

## Notes
- The project has hardcoded Supabase credentials as fallbacks in src/lib/supabase.js
- Vite config already includes `allowedHosts: true` for Replit iframe support
- Frontend must serve on 0.0.0.0:5000 for Replit preview to work
- Database table names must be lowercase (PostgreSQL behavior)
- Journal entries require `conres_journal_entries` table to be created in Supabase
- AI Practice supports 5 relationship types: romantic, friend, coworker, manager, family
