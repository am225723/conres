# Couples Texting Module - Setup Instructions

## ⚠️ IMPORTANT: Database Setup Required

Before the module can work, you **MUST** apply the database schema to your Supabase project.

## Step-by-Step Setup

### 1. Apply Database Schema to Supabase

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/vrzpwzwhdikmdmagkbtt
2. Navigate to the **SQL Editor** (left sidebar)
3. Click **"New Query"**
4. Copy the entire contents of `supabase-schema.sql`
5. Paste it into the SQL Editor
6. Click **"Run"** to execute the SQL
7. Wait for confirmation that all tables, functions, and triggers were created

### 2. Verify Database Setup

After applying the schema, run the test script:

```bash
cd conres
node test-supabase-connection.js
```

You should see:
```
🎉 All tests passed! The Supabase integration is working correctly.
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 4. Test the Module

1. Open the application in your browser
2. Enter a nickname
3. Click "Create New Session"
4. Copy the session code
5. Open the application in another browser/incognito window
6. Enter a different nickname
7. Paste the session code and click "Join"
8. Send messages between both windows
9. Verify real-time updates work

## What the Schema Creates

The schema creates:

### Tables
- `sessions` - Stores chat sessions
- `participants` - Tracks users in sessions
- `messages` - Stores all messages with tone analysis
- `session_analytics` - Optional analytics data

### Functions
- `generate_session_code()` - Creates unique 8-character codes
- `update_session_activity()` - Updates last activity timestamp
- `update_participant_count()` - Maintains participant counts

### Triggers
- Auto-update session activity on new messages
- Auto-update participant count on join/leave
- Auto-update session status when 2+ participants join

### Security
- Row Level Security (RLS) policies enabled
- Public read/write access (suitable for demo/testing)
- Can be customized for production use

## Troubleshooting

### "Could not find the table 'public.sessions'"
- The database schema hasn't been applied yet
- Follow Step 1 above to apply the schema

### "Failed to create session"
- Check that all tables were created successfully
- Verify your Supabase credentials are correct
- Check Supabase project logs for errors

### Real-time updates not working
- Ensure Supabase Realtime is enabled in project settings
- Check browser console for subscription errors
- Verify the session code is correct

### Messages not appearing
- Check that the messages table exists
- Verify triggers are active
- Check Supabase logs for insert errors

## Environment Variables

The module uses these environment variables:

```env
VITE_SUPABASE_URL=https://vrzpwzwhdikmdmagkbtt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

These are already configured in:
- `src/lib/supabase.js` (with fallback values)
- `.env.local` (for local development)

For production deployment, set these in your hosting platform (Vercel, Netlify, etc.)

## Next Steps

After setup is complete:

1. ✅ Test session creation and joining
2. ✅ Verify real-time messaging works
3. ✅ Test tone analysis features
4. ✅ Try AI-powered suggestions
5. ✅ Test on multiple devices
6. 🚀 Deploy to production

## Support

If you encounter issues:

1. Check the browser console for errors
2. Review Supabase project logs
3. Verify all schema objects were created
4. Run the test script to diagnose issues
5. Check the COUPLES_TEXTING_README.md for detailed documentation