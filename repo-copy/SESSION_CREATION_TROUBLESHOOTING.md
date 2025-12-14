# Session Creation Error Troubleshooting Guide

## Error Analysis

Based on your stack trace, you're encountering multiple issues:

1. **404 NOT_FOUND Error**: `https://conres.vercel.app/api/create-session` endpoint doesn't exist
2. **JavaScript Runtime Errors**: Issues with message formatting and database insertion
3. **Environment Configuration**: Missing or incorrect API endpoint configuration

## Root Causes

### 1. API Endpoint Not Deployed
The error shows the API endpoint is returning 404, which means:
- The `api/create-session.js` file isn't properly deployed to Vercel
- Vercel configuration might be incorrect
- The build process isn't including API routes

### 2. Environment Variables Missing
The API endpoint requires:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Database Schema Issues
The JavaScript errors suggest database insertion problems.

## Step-by-Step Solution

### Step 1: Verify Local API Structure

First, ensure your API file is correctly structured:

```javascript
// api/create-session.js
const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user1_id, user2_id } = req.body;

    if (!user1_id || !user2_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Your Supabase logic here
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase
      .from('sessions')
      .insert({ user1_id, user2_id })
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, session: data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
```

### Step 2: Fix Vercel Configuration

Update your `vercel.json`:

```json
{
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    }
  ],
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

### Step 3: Set Environment Variables

In your Vercel dashboard, add these environment variables:

1. Go to your Vercel project settings
2. Add Environment Variables:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_ANON_KEY=your_anon_key
   ```

### Step 4: Update Frontend API Calls

The frontend is calling the wrong endpoint format. Update `src/lib/supabase.js`:

```javascript
export const createSession = async () => {
  try {
    const response = await fetch('/api/create-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user1_id: 'user1', // Replace with actual user IDs
        user2_id: 'user2'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create session');
    }

    const data = await response.json();
    return { success: true, session: data.session };
  } catch (error) {
    console.error('Error creating session:', error);
    return { success: false, error: error.message };
  }
};
```

### Step 5: Test Locally First

Before deploying:

1. Start local development server:
   ```bash
   npm run dev
   ```

2. Test the API endpoint:
   ```bash
   curl -X POST http://localhost:5173/api/create-session \
     -H "Content-Type: application/json" \
     -d '{"user1_id": "test1", "user2_id": "test2"}'
   ```

### Step 6: Deploy to Vercel

1. Push changes to GitHub:
   ```bash
   git add .
   git commit -m "Fix session creation API"
   git push origin main
   ```

2. Trigger Vercel deployment or wait for automatic deployment

### Step 7: Verify Deployment

1. Check Vercel function logs for errors
2. Test the deployed endpoint:
   ```bash
   curl -X POST https://your-app.vercel.app/api/create-session \
     -H "Content-Type: application/json" \
     -d '{"user1_id": "test1", "user2_id": "test2"}'
   ```

## Common Issues and Solutions

### Issue 1: API Returns 404
**Solution**: Ensure `api/create-session.js` exists and Vercel configuration is correct.

### Issue 2: Environment Variables Not Available
**Solution**: Check Vercel dashboard environment variables and redeploy.

### Issue 3: Database Connection Error
**Solution**: Verify Supabase credentials and database schema.

### Issue 4: CORS Error
**Solution**: Ensure CORS headers are set in the API function.

## Debugging Checklist

- [ ] API file exists in `api/create-session.js`
- [ ] Vercel configuration includes API routes
- [ ] Environment variables are set in Vercel
- [ ] Database schema has `sessions` table
- [ ] Frontend is calling correct endpoint
- [ ] CORS headers are properly configured
- [ ] Local testing passes before deployment

## Next Steps

1. Implement the fixes above
2. Test locally
3. Deploy to Vercel
4. Test the deployed application
5. Monitor Vercel function logs for any remaining issues

If you continue to experience issues, please share:
- Your Vercel deployment logs
- The exact API response you're getting
- Your current `vercel.json` configuration
- Your environment variable setup