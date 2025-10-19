# Quick Start Guide
## Couple's Messaging Platform with Emotion Tracking

Get your platform up and running in 5 minutes!

---

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- Git installed

---

## Step 1: Clone and Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/am225723/conres.git
cd conres

# Install dependencies
npm install
```

---

## Step 2: Configure Environment (1 minute)

```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your credentials
# The file already has the Supabase credentials filled in
# You only need to add your Perplexity API key (optional)
```

**Your `.env` should look like this:**
```env
VITE_SUPABASE_URL=https://vrzpwzwhdikmdmagkbtt.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PPLX_API_KEY=your_key_here  # Optional - for AI features
SUPABASE_URL=https://vrzpwzwhdikmdmagkbtt.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 3: Set Up Database (1 minute)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Open your project
3. Navigate to **SQL Editor**
4. Run these SQL files in order:
   - First: `supabase-schema.sql`
   - Then: `emotion-tracking-schema.sql`

**Or use the combined file:**
```bash
# This creates a single file with all schemas
cat supabase-schema.sql emotion-tracking-schema.sql > complete-schema.sql
# Then run complete-schema.sql in Supabase SQL Editor
```

---

## Step 4: Start the Application (1 minute)

**Terminal 1 - API Server:**
```bash
node server.js
```

**Terminal 2 - Development Server:**
```bash
npm run dev
```

---

## Step 5: Access the Application

Open your browser and go to:
```
http://localhost:3000
```

---

## Testing the Platform

### Test Session Creation
1. Click "Start New Session"
2. You should see a session code generated
3. Share the URL with another browser/device

### Test Messaging
1. Open the session in two browser windows
2. Send a message from one window
3. It should appear in the other window (real-time or within 2 seconds)

### Test AI Features
1. Type a message
2. Click "Get Suggestions" or "Reword Message"
3. AI will generate alternatives (requires PPLX_API_KEY)

### Test Emotion Tracking
1. Send messages with different emotions
2. Watch the background color change
3. Check emotion visualizations in the dashboard

---

## Common Issues and Solutions

### Issue: "Session creation failed"
**Solution:** Check that your Supabase credentials are correct in `.env`

### Issue: "Messages not appearing"
**Solution:** This is normal - the system uses polling fallback. Messages will appear within 2 seconds.

### Issue: "AI features not working"
**Solution:** Add your Perplexity API key to `.env` file. AI features are optional.

### Issue: "Database error"
**Solution:** Make sure you ran both SQL schema files in Supabase SQL Editor.

---

## Next Steps

1. **Customize the platform:**
   - Modify colors in `src/index.css`
   - Add your branding
   - Customize emotion categories

2. **Deploy to production:**
   - See `DEPLOYMENT_GUIDE.md` for Vercel deployment
   - Configure environment variables in Vercel
   - Test thoroughly before sharing

3. **Explore features:**
   - Emotion Timeline
   - Emotion Gauge
   - Emotion Distribution
   - Emotion Journal

---

## Getting Help

- **Documentation:** See `COMPREHENSIVE_DEBUG_REPORT.md`
- **Issues:** https://github.com/am225723/conres/issues
- **Setup Details:** See `SETUP_INSTRUCTIONS.md`

---

## Features Overview

✅ **Real-time Messaging** - Chat with your partner in real-time  
✅ **AI Suggestions** - Get AI-powered message suggestions  
✅ **Emotion Tracking** - Track emotional patterns over time  
✅ **Tone Analysis** - Understand the tone of your messages  
✅ **Visual Feedback** - Background colors change based on emotions  
✅ **Emotion Journal** - Keep a personal emotion journal  
✅ **Pattern Recognition** - Identify communication patterns  
✅ **Insights** - Get insights into your communication dynamics  

---

**Happy Chatting! 💬❤️**