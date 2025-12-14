#!/bin/bash

# Emotion Tracking Setup Script
# This script sets up the emotion tracking database schema in Supabase

echo "🎭 Setting up Emotion Tracking System..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null
then
    echo "⚠️  Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please update it with your credentials."
    echo ""
fi

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if Supabase credentials are set
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Supabase credentials not found in .env file"
    echo "   Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
    exit 1
fi

echo "📊 Supabase URL: $VITE_SUPABASE_URL"
echo ""

# Ask for confirmation
read -p "Do you want to apply the emotion tracking schema to your Supabase database? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Setup cancelled"
    exit 1
fi

echo ""
echo "🔧 Applying emotion tracking schema..."
echo ""

# Apply the schema using Supabase CLI or psql
# Note: You'll need to run this SQL manually in Supabase SQL Editor
# or use the Supabase CLI with proper authentication

echo "📝 To complete the setup, please:"
echo ""
echo "1. Go to your Supabase Dashboard: https://app.supabase.com"
echo "2. Navigate to SQL Editor"
echo "3. Copy and paste the contents of 'emotion-tracking-schema.sql'"
echo "4. Run the SQL script"
echo ""
echo "Alternatively, if you have psql installed and database access:"
echo "   psql \$DATABASE_URL -f emotion-tracking-schema.sql"
echo ""

# Create a combined schema file for easy deployment
echo "📦 Creating combined schema file..."
cat supabase-schema.sql emotion-tracking-schema.sql > complete-schema.sql
echo "✅ Created complete-schema.sql with all database tables"
echo ""

echo "✨ Setup preparation complete!"
echo ""
echo "Next steps:"
echo "1. Apply the database schema (see instructions above)"
echo "2. Install dependencies: npm install"
echo "3. Start the API server: node server.js"
echo "4. Start the dev server: npm run dev"
echo ""
echo "📚 For more information, see SETUP_INSTRUCTIONS.md"