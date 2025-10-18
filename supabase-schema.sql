-- =====================================================
-- COUPLE TEXTING MODULE - COMPLETE SUPABASE SCHEMA
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_code VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'ended')),
    participant_count INTEGER DEFAULT 0,
    last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_last_activity ON sessions(last_activity);

-- =====================================================
-- 2. PARTICIPANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    nickname VARCHAR(50),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(session_id, user_id)
);

-- Indexes for participants
CREATE INDEX IF NOT EXISTS idx_participants_session ON participants(session_id);
CREATE INDEX IF NOT EXISTS idx_participants_user ON participants(user_id);

-- =====================================================
-- 3. MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    message_text TEXT NOT NULL,
    tone_analysis JSONB,
    impact_preview TEXT,
    firmness_level VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT false,
    edited_at TIMESTAMPTZ
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);

-- =====================================================
-- 4. SESSION ANALYTICS TABLE (Optional - for insights)
-- =====================================================
CREATE TABLE IF NOT EXISTS session_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    total_messages INTEGER DEFAULT 0,
    gentle_messages INTEGER DEFAULT 0,
    balanced_messages INTEGER DEFAULT 0,
    firm_messages INTEGER DEFAULT 0,
    accusatory_messages INTEGER DEFAULT 0,
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. FUNCTIONS
-- =====================================================

-- Function to update session last activity
CREATE OR REPLACE FUNCTION update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE sessions 
    SET last_activity = NOW(), updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update participant count
CREATE OR REPLACE FUNCTION update_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE sessions 
        SET participant_count = participant_count + 1,
            status = CASE WHEN participant_count + 1 >= 2 THEN 'active' ELSE status END
        WHERE id = NEW.session_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE sessions 
        SET participant_count = participant_count - 1
        WHERE id = OLD.session_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique session code
CREATE OR REPLACE FUNCTION generate_session_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Trigger to update session activity when messages are sent
DROP TRIGGER IF EXISTS trigger_update_session_activity ON messages;
CREATE TRIGGER trigger_update_session_activity
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_session_activity();

-- Trigger to update participant count
DROP TRIGGER IF EXISTS trigger_update_participant_count_insert ON participants;
CREATE TRIGGER trigger_update_participant_count_insert
    AFTER INSERT ON participants
    FOR EACH ROW
    EXECUTE FUNCTION update_participant_count();

DROP TRIGGER IF EXISTS trigger_update_participant_count_delete ON participants;
CREATE TRIGGER trigger_update_participant_count_delete
    AFTER DELETE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION update_participant_count();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_analytics ENABLE ROW LEVEL SECURITY;

-- Sessions: Anyone can read and create sessions
CREATE POLICY "Anyone can read sessions" ON sessions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create sessions" ON sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update sessions" ON sessions
    FOR UPDATE USING (true);

-- Participants: Anyone can read and create participants
CREATE POLICY "Anyone can read participants" ON participants
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create participants" ON participants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update their own participant record" ON participants
    FOR UPDATE USING (true);

-- Messages: Anyone in a session can read and create messages
CREATE POLICY "Anyone can read messages" ON messages
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create messages" ON messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (true);

-- Session Analytics: Anyone can read
CREATE POLICY "Anyone can read session analytics" ON session_analytics
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create session analytics" ON session_analytics
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- 8. HELPER VIEWS
-- =====================================================

-- View for active sessions with participant info
CREATE OR REPLACE VIEW active_sessions_view AS
SELECT 
    s.id,
    s.session_code,
    s.status,
    s.participant_count,
    s.created_at,
    s.last_activity,
    COUNT(m.id) as message_count
FROM sessions s
LEFT JOIN messages m ON s.id = m.session_id
WHERE s.status IN ('waiting', 'active')
GROUP BY s.id, s.session_code, s.status, s.participant_count, s.created_at, s.last_activity;

-- =====================================================
-- 9. CLEANUP FUNCTION (Optional - for old sessions)
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void AS $$
BEGIN
    -- Delete sessions older than 7 days with no activity
    DELETE FROM sessions 
    WHERE last_activity < NOW() - INTERVAL '7 days'
    AND status = 'ended';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. SAMPLE DATA (Optional - for testing)
-- =====================================================

-- Uncomment to insert sample data for testing
-- INSERT INTO sessions (session_code, status) VALUES 
--     (generate_session_code(), 'waiting'),
--     (generate_session_code(), 'active');