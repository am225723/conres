import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

console.log('🔧 Connecting to Supabase:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSetup() {
  console.log('\n📊 Checking database setup...\n');

  // Check sessions table
  console.log('1. Checking sessions table...');
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('*')
    .limit(1);

  if (sessionsError) {
    console.log('   ❌ sessions table:', sessionsError.message);
  } else {
    console.log('   ✅ sessions table exists');
  }

  // Check participants table
  console.log('2. Checking participants table...');
  const { data: participants, error: participantsError } = await supabase
    .from('participants')
    .select('*')
    .limit(1);

  if (participantsError) {
    console.log('   ❌ participants table:', participantsError.message);
  } else {
    console.log('   ✅ participants table exists');
  }

  // Check messages table
  console.log('3. Checking messages table...');
  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .limit(1);

  if (messagesError) {
    console.log('   ❌ messages table:', messagesError.message);
    console.log('   ⚠️  This is the main issue preventing message sending!');
  } else {
    console.log('   ✅ messages table exists');
  }

  // Check session_analytics table
  console.log('4. Checking session_analytics table...');
  const { data: analytics, error: analyticsError } = await supabase
    .from('session_analytics')
    .select('*')
    .limit(1);

  if (analyticsError) {
    console.log('   ❌ session_analytics table:', analyticsError.message);
  } else {
    console.log('   ✅ session_analytics table exists');
  }

  console.log('\n' + '='.repeat(60));

  if (messagesError || participantsError) {
    console.log('\n🚨 DATABASE SETUP INCOMPLETE!\n');
    console.log('To fix this:');
    console.log('1. Go to: https://supabase.com/dashboard/project/vrzpwzwhdikmdmagkbtt');
    console.log('2. Click "SQL Editor" in the left sidebar');
    console.log('3. Click "New Query"');
    console.log('4. Copy and paste the contents of "supabase-schema.sql"');
    console.log('5. Click "Run"\n');
  } else {
    console.log('\n✅ All database tables are set up correctly!\n');
  }
}

checkDatabaseSetup().catch(console.error);
