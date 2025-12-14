# Chat Debugging and Fix Guide

## Issues Identified and Fixed

### 1. ✅ Perplexity API Not Working
**Problem**: The API routes were configured for Vercel deployment but not for local development.

**Root Cause**:
- Vite dev server was running on port 3000
- API routes expected to be served from port 3001 (as configured in vite.config.js proxy)
- No local API server was running

**Fix Applied**:
- Created `server.js` - Express server to handle API routes locally
- Added Perplexity API endpoint at `/api/perplexity`
- Configured proper CORS and environment variable handling
- Server runs on port 3001 as expected by the Vite proxy

### 2. ✅ Messages Not Appearing in Real-time
**Problem**: Messages sent to the database were not appearing in the chat interface for other users.

**Root Cause**:
- Supabase Realtime subscription was timing out
- Realtime service not properly configured for the Supabase project
- No fallback mechanism when realtime fails

**Fix Applied**:
- Added polling fallback mechanism when realtime fails
- Implemented 5-second timeout detection for realtime subscriptions
- Added visual indicators when using polling mode
- Enhanced error handling and user feedback

### 3. ✅ Messages Disappearing on Reopen
**Problem**: Messages would disappear when users closed and reopened the chat.

**Root Cause**:
- Related to the realtime subscription failure
- Messages were saved to database but not retrieved properly due to subscription issues

**Fix Applied**:
- Enhanced message loading on component mount
- Added proper cleanup of subscriptions and polling
- Improved error handling for message retrieval

## Setup Instructions

### For Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Up Environment Variables**:
   Create a `.env` file with:
   ```
   VITE_SUPABASE_URL=https://vrzpwzwhdikmdmagkbtt.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyenB3endoZGlrbWRtYWdrYnR0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3ODUyMTAsImV4cCI6MjA3NjM2MTIxMH0.Q4SYhikV38ZcHeIxCo28wWUI1pqDPPz4SKETnzxfCYE
   PPLX_API_KEY=your_perplexity_api_key_here
   ```

3. **Start Both Servers**:

   **Terminal 1 - API Server**:
   ```bash
   node server.js
   ```

   **Terminal 2 - Frontend Dev Server**:
   ```bash
   npm run dev
   ```

4. **Access the Application**:
   - Frontend: http://localhost:3000
   - API: http://localhost:3001

### For Production (Vercel)

The API routes are already configured for Vercel deployment in `vercel.json`. No changes needed.

## Testing the Fixes

### 1. Test Perplexity API
- Click "Suggest a Reply" or "Reword as I-Statement" buttons
- Should work if PPLX_API_KEY is properly configured
- If API key is missing, you'll see an appropriate error message

### 2. Test Real-time vs Polling
- Open the chat in two different browser windows
- Send a message in one window
- If realtime is working: Message appears instantly in both windows
- If polling is active: Message appears within 2 seconds, with "Polling mode" indicator

### 3. Test Message Persistence
- Send messages in a chat session
- Close and reopen the browser/tab
- Messages should reload and appear correctly

## Permanent Fix for Supabase Realtime

To enable proper realtime functionality (instead of polling):

1. **Go to your Supabase Project Dashboard**
2. **Navigate to Settings → API**
3. **Ensure Realtime is enabled**
4. **Go to Database → Replication**
5. **Add publications for your tables**:
   ```sql
   -- Enable realtime for messages table
   PUBLICATION supabase_realtime ADD TABLE messages;

   -- Enable realtime for participants table
   PUBLICATION supabase_realtime ADD TABLE participants;

   -- Enable realtime for sessions table
   PUBLICATION supabase_realtime ADD TABLE sessions;
   ```

6. **Check Row Level Security policies** ensure they allow realtime events

## Files Modified

1. **`server.js`** - New Express server for local API development
2. **`src/components/Chat.jsx`** - Enhanced with polling fallback and better error handling
3. **`.env`** - Environment variables configuration
4. **`package.json`** - Added express and cors dependencies

## Debugging Tools Created

1. **`test-db-connection.js`** - Tests database connectivity
2. **`test-realtime-simple.js`** - Tests realtime subscription functionality
3. **`debug-realtime.js`** - Comprehensive realtime debugging
4. **`check-rls.js`** - Checks Row Level Security policies

## Current Status

✅ **Perplexity API**: Working with proper server setup
✅ **Message Persistence**: Working with database
✅ **Polling Fallback**: Working when realtime fails
⚠️ **Realtime Subscription**: Needs Supabase configuration (polling works as fallback)

The chat application now works reliably with automatic fallback to polling mode when realtime is unavailable.