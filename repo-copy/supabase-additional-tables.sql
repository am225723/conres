-- =====================================================
-- ADDITIONAL TABLES FOR AI FEATURES
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/froxodstewdswllgokmu/sql/new
-- =====================================================

-- 1. I-Statement History Table
CREATE TABLE IF NOT EXISTS conres_istatement_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_message TEXT,
    final_statement TEXT NOT NULL,
    conversation JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Role-Play Sessions Table
CREATE TABLE IF NOT EXISTS conres_roleplay_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario TEXT NOT NULL,
    partner_style VARCHAR(50),
    conversation JSONB,
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Emotion Tracking Table
CREATE TABLE IF NOT EXISTS conres_emotion_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emotions JSONB,
    needs JSONB,
    insecurity_notes TEXT,
    affirmation TEXT,
    healing_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User Progress Table
CREATE TABLE IF NOT EXISTS conres_user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_sessions INTEGER DEFAULT 0,
    total_istatements INTEGER DEFAULT 0,
    total_roleplay INTEGER DEFAULT 0,
    healing_sessions INTEGER DEFAULT 0,
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE conres_istatement_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE conres_roleplay_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conres_emotion_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE conres_user_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies (open access for this app)
CREATE POLICY "all_istatement" ON conres_istatement_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_roleplay" ON conres_roleplay_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_emotion" ON conres_emotion_tracking FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "all_progress" ON conres_user_progress FOR ALL USING (true) WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_istatement_created ON conres_istatement_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roleplay_created ON conres_roleplay_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emotion_created ON conres_emotion_tracking(created_at DESC);
