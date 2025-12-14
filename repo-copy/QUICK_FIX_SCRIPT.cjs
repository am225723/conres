// Quick Fix Script for Session Creation Issues
// Run this script to diagnose and fix common problems

const fs = require('fs');
const path = require('path');

console.log('🔧 Session Creation Fix Script');
console.log('================================');

// 1. Check if API directory exists
const apiDir = path.join(__dirname, 'api');
if (!fs.existsSync(apiDir)) {
  console.log('❌ API directory not found. Creating...');
  fs.mkdirSync(apiDir, { recursive: true });
} else {
  console.log('✅ API directory exists');
}

// 2. Check if create-session.js exists and fix it
const apiFile = path.join(apiDir, 'create-session.js');
const fixedApiContent = `const { createClient } = require('@supabase/supabase-js');

export default async function handler(req, res) {
  // Enable CORS
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
      return res.status(400).json({ error: 'Missing required fields: user1_id, user2_id' });
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Create session
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user1_id,
        user2_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ success: true, session: data });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({ error: error.message });
  }
}`;

fs.writeFileSync(apiFile, fixedApiContent);
console.log('✅ Fixed create-session.js created/updated');

// 3. Update vercel.json
const vercelConfig = path.join(__dirname, 'vercel.json');
const fixedVercelConfig = `{
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
}`;

fs.writeFileSync(vercelConfig, fixedVercelConfig);
console.log('✅ Fixed vercel.json created/updated');

// 4. Create test script
const testScript = `#!/bin/bash
echo "🧪 Testing Session Creation API"
echo "================================"

# Test 1: Check if API endpoint exists
echo "Test 1: Checking API endpoint..."
curl -I https://conres.vercel.app/api/create-session

echo -e "\\nTest 2: Testing POST request..."
curl -X POST https://conres.vercel.app/api/create-session \\
  -H "Content-Type: application/json" \\
  -d '{"user1_id": "test1", "user2_id": "test2"}' \\
  -v

echo -e "\\n✅ Tests completed"
`;

fs.writeFileSync(path.join(__dirname, 'test-api.sh'), testScript);
console.log('✅ Test script created: test-api.sh');

console.log('\n🎉 Fix script completed!');
console.log('\nNext steps:');
console.log('1. Set up environment variables in Vercel dashboard');
console.log('2. Deploy to Vercel');
console.log('3. Run: bash test-api.sh');
console.log('4. Check Vercel function logs for any errors');