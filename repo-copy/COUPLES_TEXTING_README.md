# Couples Texting Module - Complete Documentation

## Overview
The Couples Texting module is a real-time, tone-aware chat application built with React and Supabase. It allows couples to communicate with real-time message analysis, tone detection, and constructive communication suggestions.

## Features

### Core Functionality
1. **Session Management**
   - Create new chat sessions with unique 8-character codes
   - Join existing sessions using session codes
   - Automatic session status updates (waiting → active)
   - Participant tracking and management

2. **Real-Time Messaging**
   - Instant message delivery using Supabase Realtime
   - Message persistence in database
   - Message history loading on session join
   - Automatic scroll to latest messages

3. **Tone Analysis**
   - Real-time tone preview before sending
   - Firmness level detection (gentle, balanced, firm)
   - Accusatory language detection
   - Visual indicators for message tone

4. **AI-Powered Features**
   - Suggest constructive replies to messages
   - Reword messages as I-statements
   - Perplexity AI integration for suggestions

5. **User Experience**
   - Nickname support for personalization
   - Participant count display
   - Online status indicators
   - Leave session functionality
   - Toast notifications for events

## Database Schema

### Tables

#### 1. sessions
Stores chat session information.

```sql
- id (UUID, Primary Key)
- session_code (VARCHAR(10), Unique)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
- status (VARCHAR: 'waiting', 'active', 'ended')
- participant_count (INTEGER)
- last_activity (TIMESTAMPTZ)
```

#### 2. participants
Tracks users in each session.

```sql
- id (UUID, Primary Key)
- session_id (UUID, Foreign Key → sessions.id)
- user_id (VARCHAR(50))
- nickname (VARCHAR(50))
- joined_at (TIMESTAMPTZ)
- last_seen (TIMESTAMPTZ)
- is_active (BOOLEAN)
```

#### 3. messages
Stores all chat messages with tone analysis.

```sql
- id (UUID, Primary Key)
- session_id (UUID, Foreign Key → sessions.id)
- user_id (VARCHAR(50))
- message_text (TEXT)
- tone_analysis (JSONB)
- impact_preview (TEXT)
- firmness_level (VARCHAR(20))
- created_at (TIMESTAMPTZ)
- is_edited (BOOLEAN)
- edited_at (TIMESTAMPTZ)
```

#### 4. session_analytics
Optional analytics for session insights.

```sql
- id (UUID, Primary Key)
- session_id (UUID, Foreign Key → sessions.id)
- total_messages (INTEGER)
- gentle_messages (INTEGER)
- balanced_messages (INTEGER)
- firm_messages (INTEGER)
- accusatory_messages (INTEGER)
- duration_minutes (INTEGER)
- created_at (TIMESTAMPTZ)
```

## Setup Instructions

### 1. Database Setup

Run the SQL schema in your Supabase project:

```bash
# Navigate to your Supabase project SQL Editor
# Copy and paste the contents of supabase-schema.sql
# Execute the SQL to create all tables, functions, and triggers
```

### 2. Environment Configuration

Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=https://vrzpwzwhdikmdmagkbtt.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

For Vercel deployment, also set:
```env
SUPABASE_URL=https://vrzpwzwhdikmdmagkbtt.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 5. Build for Production

```bash
npm run build
```

### 6. Deploy to Vercel

```bash
npm run preview
# or
vercel deploy
```

## Usage Guide

### Creating a Session

1. Enter your nickname
2. Click "Create New Session"
3. Share the generated 8-character code with your partner
4. Wait for your partner to join

### Joining a Session

1. Enter your nickname
2. Enter the session code provided by your partner
3. Click "Join"
4. Start chatting!

### Sending Messages

1. Type your message in the text area
2. View the real-time tone preview
3. Click "Send" or press Enter
4. Your message appears with tone indicators

### Using AI Features

**Suggest a Reply:**
- Click "Suggest a Reply" to get AI-generated response suggestions
- The suggestion will populate the message box
- Edit as needed before sending

**Reword as I-Statement:**
- Type your message
- Click "Reword as I-Statement"
- The AI will rephrase your message to be more constructive
- Review and send

### Leaving a Session

- Click the "Leave" button in the header
- You'll return to the session creation/join screen
- Your messages remain in the session history

## Technical Architecture

### Frontend Components

**CouplesTexting.jsx**
- Main entry component
- Handles session creation and joining
- Manages user identification and nicknames
- Renders Chat component when session is active

**Chat.jsx**
- Real-time chat interface
- Message display and sending
- Tone analysis preview
- AI-powered features integration
- Participant management

### Backend Integration

**Supabase Client (src/lib/supabase.js)**
- Configured Supabase client
- Helper functions for all database operations
- Real-time subscription management

**API Routes**
- `/api/create-session-proxy.js` - Session creation endpoint
- `/api/perplexity.js` - AI suggestions endpoint

### Real-Time Features

The module uses Supabase Realtime with PostgreSQL triggers:

1. **Message Broadcasting**
   - New messages trigger real-time updates
   - All participants receive instant notifications

2. **Participant Updates**
   - Join/leave events broadcast to all users
   - Participant count updates automatically

3. **Session Status**
   - Automatic status transitions
   - Activity tracking

## Security Features

### Row Level Security (RLS)

All tables have RLS policies enabled:

- **Sessions**: Public read/write (anyone can create/join)
- **Participants**: Users can update their own records
- **Messages**: Users can read all messages in their session
- **Analytics**: Public read access

### Data Privacy

- User IDs are generated client-side (nanoid)
- No personal information required
- Sessions auto-cleanup after 7 days of inactivity

## Troubleshooting

### Common Issues

**1. Real-time updates not working**
- Check Supabase Realtime is enabled in project settings
- Verify environment variables are correct
- Check browser console for subscription errors

**2. Session creation fails**
- Verify database schema is properly set up
- Check Supabase credentials
- Ensure RLS policies are configured

**3. Messages not persisting**
- Verify messages table exists
- Check database triggers are active
- Review Supabase logs for errors

**4. AI features not working**
- Verify Perplexity API is configured
- Check `/api/perplexity.js` endpoint
- Review API key and permissions

## Performance Optimization

### Database Indexes

The schema includes optimized indexes for:
- Session code lookups
- Message retrieval by session
- Participant queries
- Time-based queries

### Real-Time Optimization

- Broadcast configuration limits events per second
- Efficient subscription management
- Automatic cleanup on unmount

## Future Enhancements

See the "Future Features" section at the end of this document for planned improvements.

## API Reference

### Supabase Helper Functions

```javascript
// Create a new session
const result = await createSession();
// Returns: { success: boolean, session: object, error?: string }

// Join an existing session
const result = await joinSession(sessionCode, userId, nickname);
// Returns: { success: boolean, session: object, isRejoining: boolean, error?: string }

// Send a message
const result = await sendMessage(sessionId, userId, messageText, toneAnalysis);
// Returns: { success: boolean, message: object, error?: string }

// Get message history
const result = await getMessageHistory(sessionId);
// Returns: { success: boolean, messages: array, error?: string }

// Get session participants
const result = await getSessionParticipants(sessionId);
// Returns: { success: boolean, participants: array, error?: string }

// Leave a session
const result = await leaveSession(sessionId, userId);
// Returns: { success: boolean, error?: string }
```

## Testing

### Manual Testing Checklist

- [ ] Create a new session
- [ ] Copy session code
- [ ] Join session from another browser/device
- [ ] Send messages from both sides
- [ ] Verify real-time updates
- [ ] Test tone analysis preview
- [ ] Try AI suggestion features
- [ ] Leave and rejoin session
- [ ] Verify message history persists

### Automated Testing (Future)

Consider adding:
- Unit tests for helper functions
- Integration tests for Supabase operations
- E2E tests for user flows
- Real-time subscription tests

## Deployment Checklist

- [ ] Database schema applied to production Supabase
- [ ] Environment variables configured in Vercel
- [ ] Build succeeds without errors
- [ ] Real-time features work in production
- [ ] API endpoints are accessible
- [ ] CORS configured correctly
- [ ] Error logging enabled
- [ ] Performance monitoring active

## Support and Maintenance

### Monitoring

Monitor these metrics:
- Active sessions count
- Message delivery latency
- Real-time connection stability
- API endpoint response times
- Database query performance

### Maintenance Tasks

- Review and clean up old sessions (7+ days inactive)
- Monitor database size and optimize as needed
- Update dependencies regularly
- Review and update RLS policies
- Backup database regularly

## License

This module is part of the ConRes project.

## Credits

Built with:
- React 18
- Supabase (Database + Realtime)
- Vite (Build tool)
- TailwindCSS (Styling)
- Perplexity AI (Suggestions)