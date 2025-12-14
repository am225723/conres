-- =====================================================
-- COUPLE TEXTING MODULE - COMPLETE SUPABASE SCHEMA
-- All tables prefixed with CONRES_
-- =====================================================

-- Enable UUID extension (Supabase uses gen_random_uuid() by default)

-- =====================================================
-- 1. SESSIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS CONRES_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_code VARCHAR(10) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'ended')),
    participant_count INTEGER DEFAULT 0,
    last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_conres_sessions_code ON CONRES_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_conres_sessions_status ON CONRES_sessions(status);
CREATE INDEX IF NOT EXISTS idx_conres_sessions_last_activity ON CONRES_sessions(last_activity);

-- =====================================================
-- 2. PARTICIPANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS CONRES_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES CONRES_sessions(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    nickname VARCHAR(50),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(session_id, user_id)
);

-- Indexes for participants
CREATE INDEX IF NOT EXISTS idx_conres_participants_session ON CONRES_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_conres_participants_user ON CONRES_participants(user_id);

-- =====================================================
-- 3. MESSAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS CONRES_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES CONRES_sessions(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_conres_messages_session ON CONRES_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_conres_messages_created ON CONRES_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conres_messages_user ON CONRES_messages(user_id);

-- =====================================================
-- 4. SESSION ANALYTICS TABLE (Optional - for insights)
-- =====================================================
CREATE TABLE IF NOT EXISTS CONRES_session_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES CONRES_sessions(id) ON DELETE CASCADE,
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
CREATE OR REPLACE FUNCTION conres_update_session_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE CONRES_sessions
    SET last_activity = NOW(), updated_at = NOW()
    WHERE id = NEW.session_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update participant count
CREATE OR REPLACE FUNCTION conres_update_participant_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE CONRES_sessions
        SET participant_count = participant_count + 1,
            status = CASE WHEN participant_count + 1 >= 2 THEN 'active' ELSE status END
        WHERE id = NEW.session_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE CONRES_sessions
        SET participant_count = participant_count - 1
        WHERE id = OLD.session_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique 6-digit session code
CREATE OR REPLACE FUNCTION conres_generate_session_code()
RETURNS TEXT AS $$
DECLARE
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || floor(random() * 10)::integer::text;
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Trigger to update session activity when messages are sent
DROP TRIGGER IF EXISTS trigger_conres_update_session_activity ON CONRES_messages;
CREATE TRIGGER trigger_conres_update_session_activity
    AFTER INSERT ON CONRES_messages
    FOR EACH ROW
    EXECUTE FUNCTION conres_update_session_activity();

-- Trigger to update participant count
DROP TRIGGER IF EXISTS trigger_conres_update_participant_count_insert ON CONRES_participants;
CREATE TRIGGER trigger_conres_update_participant_count_insert
    AFTER INSERT ON CONRES_participants
    FOR EACH ROW
    EXECUTE FUNCTION conres_update_participant_count();

DROP TRIGGER IF EXISTS trigger_conres_update_participant_count_delete ON CONRES_participants;
CREATE TRIGGER trigger_conres_update_participant_count_delete
    AFTER DELETE ON CONRES_participants
    FOR EACH ROW
    EXECUTE FUNCTION conres_update_participant_count();

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE CONRES_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE CONRES_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE CONRES_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE CONRES_session_analytics ENABLE ROW LEVEL SECURITY;

-- Sessions: Anyone can read and create sessions
CREATE POLICY "Anyone can read sessions" ON CONRES_sessions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create sessions" ON CONRES_sessions
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update sessions" ON CONRES_sessions
    FOR UPDATE USING (true);

-- Participants: Anyone can read and create participants
CREATE POLICY "Anyone can read participants" ON CONRES_participants
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create participants" ON CONRES_participants
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update their own participant record" ON CONRES_participants
    FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete participants" ON CONRES_participants
    FOR DELETE USING (true);

-- Messages: Anyone in a session can read and create messages
CREATE POLICY "Anyone can read messages" ON CONRES_messages
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create messages" ON CONRES_messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own messages" ON CONRES_messages
    FOR UPDATE USING (true);

-- Session Analytics: Anyone can read
CREATE POLICY "Anyone can read session analytics" ON CONRES_session_analytics
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create session analytics" ON CONRES_session_analytics
    FOR INSERT WITH CHECK (true);

-- =====================================================
-- 8. HELPER VIEWS
-- =====================================================

-- View for active sessions with participant info
CREATE OR REPLACE VIEW CONRES_active_sessions_view AS
SELECT
    s.id,
    s.session_code,
    s.status,
    s.participant_count,
    s.created_at,
    s.last_activity,
    COUNT(m.id) as message_count
FROM CONRES_sessions s
LEFT JOIN CONRES_messages m ON s.id = m.session_id
WHERE s.status IN ('waiting', 'active')
GROUP BY s.id, s.session_code, s.status, s.participant_count, s.created_at, s.last_activity;

-- =====================================================
-- 9. CLEANUP FUNCTION (Optional - for old sessions)
-- =====================================================

CREATE OR REPLACE FUNCTION conres_cleanup_old_sessions()
RETURNS void AS $$
BEGIN
    -- Delete sessions older than 7 days with no activity
    DELETE FROM CONRES_sessions
    WHERE last_activity < NOW() - INTERVAL '7 days'
    AND status = 'ended';
END;
$$ LANGUAGE plpgsql;
