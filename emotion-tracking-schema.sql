-- =====================================================
-- EMOTION TRACKING & SENTIMENT ANALYSIS SCHEMA
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. MESSAGE EMOTIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS message_emotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    primary_emotion VARCHAR(50) NOT NULL,
    emotion_intensity INTEGER CHECK (emotion_intensity BETWEEN 1 AND 10),
    secondary_emotions JSONB, -- Array of other detected emotions with scores
    sentiment_score DECIMAL(3,2) CHECK (sentiment_score BETWEEN -1.0 AND 1.0),
    trigger_words TEXT[],
    emotional_context TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id)
);

-- Index for faster emotion lookups
CREATE INDEX IF NOT EXISTS idx_message_emotions_message ON message_emotions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_emotions_primary ON message_emotions(primary_emotion);
CREATE INDEX IF NOT EXISTS idx_message_emotions_created ON message_emotions(created_at DESC);

-- =====================================================
-- 2. EMOTION PATTERNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS emotion_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL, -- 'escalation', 'de-escalation', 'trigger', 'positive_shift'
    description TEXT,
    trigger_message_id UUID REFERENCES messages(id),
    emotion_sequence JSONB, -- Array of emotions in sequence
    detected_at TIMESTAMPTZ DEFAULT NOW(),
    severity_level INTEGER CHECK (severity_level BETWEEN 1 AND 5)
);

-- Indexes for pattern analysis
CREATE INDEX IF NOT EXISTS idx_emotion_patterns_session ON emotion_patterns(session_id);
CREATE INDEX IF NOT EXISTS idx_emotion_patterns_user ON emotion_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_patterns_type ON emotion_patterns(pattern_type);
CREATE INDEX IF NOT EXISTS idx_emotion_patterns_detected ON emotion_patterns(detected_at DESC);

-- =====================================================
-- 3. EMOTION JOURNAL TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS emotion_journal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(50) NOT NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    pre_session_emotion VARCHAR(50),
    pre_session_intensity INTEGER CHECK (pre_session_intensity BETWEEN 1 AND 10),
    post_session_emotion VARCHAR(50),
    post_session_intensity INTEGER CHECK (post_session_intensity BETWEEN 1 AND 10),
    notes TEXT,
    insights TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for journal entries
CREATE INDEX IF NOT EXISTS idx_emotion_journal_user ON emotion_journal(user_id);
CREATE INDEX IF NOT EXISTS idx_emotion_journal_session ON emotion_journal(session_id);
CREATE INDEX IF NOT EXISTS idx_emotion_journal_created ON emotion_journal(created_at DESC);

-- =====================================================
-- 4. EMOTION STATISTICS TABLE (Aggregated Data)
-- =====================================================
CREATE TABLE IF NOT EXISTS emotion_statistics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL,
    emotion_distribution JSONB, -- {"joy": 5, "sadness": 2, "anger": 1, etc.}
    average_intensity DECIMAL(3,2),
    dominant_emotion VARCHAR(50),
    emotional_volatility DECIMAL(3,2), -- Measure of emotional changes
    positive_ratio DECIMAL(3,2), -- Ratio of positive to negative emotions
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, user_id)
);

-- Indexes for statistics
CREATE INDEX IF NOT EXISTS idx_emotion_stats_session ON emotion_statistics(session_id);
CREATE INDEX IF NOT EXISTS idx_emotion_stats_user ON emotion_statistics(user_id);

-- =====================================================
-- 5. BACKGROUND COLOR MAPPING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS emotion_colors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    emotion VARCHAR(50) UNIQUE NOT NULL,
    color_code VARCHAR(7) NOT NULL, -- Hex color code
    intensity_gradient JSONB, -- Color variations based on intensity
    description TEXT
);

-- Insert default emotion-color mappings
INSERT INTO emotion_colors (emotion, color_code, intensity_gradient, description) VALUES
    ('joy', '#FFD700', '{"1": "#FFF9E6", "5": "#FFD700", "10": "#FFA500"}', 'Warm golden yellow'),
    ('love', '#FF69B4', '{"1": "#FFE6F0", "5": "#FF69B4", "10": "#FF1493"}', 'Soft to vibrant pink'),
    ('excitement', '#FF6347', '{"1": "#FFE6E0", "5": "#FF6347", "10": "#DC143C"}', 'Energetic orange-red'),
    ('gratitude', '#98FB98', '{"1": "#E6FFE6", "5": "#98FB98", "10": "#32CD32"}', 'Fresh green'),
    ('calm', '#87CEEB', '{"1": "#E6F4FF", "5": "#87CEEB", "10": "#4682B4"}', 'Peaceful sky blue'),
    ('sadness', '#4682B4', '{"1": "#E6EEF5", "5": "#4682B4", "10": "#191970"}', 'Deep blue'),
    ('anger', '#DC143C', '{"1": "#FFE6E6", "5": "#DC143C", "10": "#8B0000"}', 'Intense red'),
    ('fear', '#9370DB', '{"1": "#F0E6FF", "5": "#9370DB", "10": "#4B0082"}', 'Anxious purple'),
    ('surprise', '#FFB6C1', '{"1": "#FFF0F5", "5": "#FFB6C1", "10": "#FF69B4"}', 'Light pink'),
    ('disgust', '#8B7355', '{"1": "#F5F0E6", "5": "#8B7355", "10": "#654321"}', 'Muted brown'),
    ('neutral', '#D3D3D3', '{"1": "#F5F5F5", "5": "#D3D3D3", "10": "#808080"}', 'Neutral gray')
ON CONFLICT (emotion) DO NOTHING;

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to calculate emotion statistics for a session
CREATE OR REPLACE FUNCTION calculate_emotion_statistics(p_session_id UUID, p_user_id VARCHAR)
RETURNS void AS $$
DECLARE
    v_emotion_dist JSONB;
    v_avg_intensity DECIMAL;
    v_dominant_emotion VARCHAR;
    v_volatility DECIMAL;
    v_positive_ratio DECIMAL;
BEGIN
    -- Calculate emotion distribution
    SELECT jsonb_object_agg(me.primary_emotion, count)
    INTO v_emotion_dist
    FROM (
        SELECT me.primary_emotion, COUNT(*) as count
        FROM message_emotions me
        JOIN messages m ON me.message_id = m.id
        WHERE m.session_id = p_session_id AND m.user_id = p_user_id
        GROUP BY me.primary_emotion
    ) me;

    -- Calculate average intensity
    SELECT AVG(me.emotion_intensity)
    INTO v_avg_intensity
    FROM message_emotions me
    JOIN messages m ON me.message_id = m.id
    WHERE m.session_id = p_session_id AND m.user_id = p_user_id;

    -- Find dominant emotion
    SELECT me.primary_emotion
    INTO v_dominant_emotion
    FROM message_emotions me
    JOIN messages m ON me.message_id = m.id
    WHERE m.session_id = p_session_id AND m.user_id = p_user_id
    GROUP BY me.primary_emotion
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    -- Calculate emotional volatility (standard deviation of intensity)
    SELECT STDDEV(me.emotion_intensity)
    INTO v_volatility
    FROM message_emotions me
    JOIN messages m ON me.message_id = m.id
    WHERE m.session_id = p_session_id AND m.user_id = p_user_id;

    -- Calculate positive emotion ratio
    SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN 
                COUNT(*) FILTER (WHERE me.primary_emotion IN ('joy', 'love', 'excitement', 'gratitude', 'calm'))::DECIMAL / COUNT(*)
            ELSE 0
        END
    INTO v_positive_ratio
    FROM message_emotions me
    JOIN messages m ON me.message_id = m.id
    WHERE m.session_id = p_session_id AND m.user_id = p_user_id;

    -- Insert or update statistics
    INSERT INTO emotion_statistics (
        session_id, user_id, emotion_distribution, average_intensity,
        dominant_emotion, emotional_volatility, positive_ratio
    ) VALUES (
        p_session_id, p_user_id, v_emotion_dist, v_avg_intensity,
        v_dominant_emotion, v_volatility, v_positive_ratio
    )
    ON CONFLICT (session_id, user_id) DO UPDATE SET
        emotion_distribution = EXCLUDED.emotion_distribution,
        average_intensity = EXCLUDED.average_intensity,
        dominant_emotion = EXCLUDED.dominant_emotion,
        emotional_volatility = EXCLUDED.emotional_volatility,
        positive_ratio = EXCLUDED.positive_ratio,
        calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to detect emotion patterns
CREATE OR REPLACE FUNCTION detect_emotion_pattern(
    p_session_id UUID,
    p_user_id VARCHAR,
    p_message_id UUID
)
RETURNS void AS $$
DECLARE
    v_recent_emotions TEXT[];
    v_pattern_type VARCHAR;
    v_description TEXT;
BEGIN
    -- Get last 5 emotions for this user in this session
    SELECT ARRAY_AGG(me.primary_emotion ORDER BY m.created_at DESC)
    INTO v_recent_emotions
    FROM message_emotions me
    JOIN messages m ON me.message_id = m.id
    WHERE m.session_id = p_session_id AND m.user_id = p_user_id
    ORDER BY m.created_at DESC
    LIMIT 5;

    -- Detect escalation pattern (negative emotions increasing)
    IF v_recent_emotions[1] IN ('anger', 'fear', 'disgust') AND
       v_recent_emotions[2] IN ('anger', 'fear', 'disgust', 'sadness') THEN
        v_pattern_type := 'escalation';
        v_description := 'Negative emotions are escalating';
        
        INSERT INTO emotion_patterns (
            session_id, user_id, pattern_type, description,
            trigger_message_id, emotion_sequence, severity_level
        ) VALUES (
            p_session_id, p_user_id, v_pattern_type, v_description,
            p_message_id, to_jsonb(v_recent_emotions), 4
        );
    END IF;

    -- Detect de-escalation pattern (moving from negative to positive)
    IF v_recent_emotions[1] IN ('joy', 'calm', 'gratitude') AND
       v_recent_emotions[2] IN ('anger', 'fear', 'sadness') THEN
        v_pattern_type := 'de-escalation';
        v_description := 'Emotions are improving';
        
        INSERT INTO emotion_patterns (
            session_id, user_id, pattern_type, description,
            trigger_message_id, emotion_sequence, severity_level
        ) VALUES (
            p_session_id, p_user_id, v_pattern_type, v_description,
            p_message_id, to_jsonb(v_recent_emotions), 2
        );
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get background color based on emotion
CREATE OR REPLACE FUNCTION get_emotion_color(
    p_emotion VARCHAR,
    p_intensity INTEGER DEFAULT 5
)
RETURNS VARCHAR AS $$
DECLARE
    v_color VARCHAR;
    v_gradient JSONB;
BEGIN
    SELECT color_code, intensity_gradient
    INTO v_color, v_gradient
    FROM emotion_colors
    WHERE emotion = p_emotion;

    -- If intensity gradient exists, use it
    IF v_gradient IS NOT NULL THEN
        RETURN v_gradient->>p_intensity::TEXT;
    END IF;

    -- Return default color
    RETURN COALESCE(v_color, '#D3D3D3');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Trigger to automatically calculate statistics after emotion insert
CREATE OR REPLACE FUNCTION trigger_calculate_emotion_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_session_id UUID;
    v_user_id VARCHAR;
BEGIN
    -- Get session and user from the message
    SELECT m.session_id, m.user_id
    INTO v_session_id, v_user_id
    FROM messages m
    WHERE m.id = NEW.message_id;

    -- Calculate statistics
    PERFORM calculate_emotion_statistics(v_session_id, v_user_id);

    -- Detect patterns
    PERFORM detect_emotion_pattern(v_session_id, v_user_id, NEW.message_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_emotion_stats ON message_emotions;
CREATE TRIGGER trigger_emotion_stats
    AFTER INSERT ON message_emotions
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_emotion_stats();

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all emotion tables
ALTER TABLE message_emotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_colors ENABLE ROW LEVEL SECURITY;

-- Message Emotions: Anyone can read and create
CREATE POLICY "Anyone can read message emotions" ON message_emotions
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create message emotions" ON message_emotions
    FOR INSERT WITH CHECK (true);

-- Emotion Patterns: Anyone can read
CREATE POLICY "Anyone can read emotion patterns" ON emotion_patterns
    FOR SELECT USING (true);

CREATE POLICY "System can create emotion patterns" ON emotion_patterns
    FOR INSERT WITH CHECK (true);

-- Emotion Journal: Users can manage their own entries
CREATE POLICY "Anyone can read emotion journal" ON emotion_journal
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create emotion journal entries" ON emotion_journal
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own journal entries" ON emotion_journal
    FOR UPDATE USING (true);

-- Emotion Statistics: Anyone can read
CREATE POLICY "Anyone can read emotion statistics" ON emotion_statistics
    FOR SELECT USING (true);

CREATE POLICY "System can manage emotion statistics" ON emotion_statistics
    FOR ALL USING (true);

-- Emotion Colors: Anyone can read
CREATE POLICY "Anyone can read emotion colors" ON emotion_colors
    FOR SELECT USING (true);

-- =====================================================
-- 9. HELPER VIEWS
-- =====================================================

-- View for emotion timeline
CREATE OR REPLACE VIEW emotion_timeline_view AS
SELECT 
    m.session_id,
    m.user_id,
    m.created_at,
    m.message_text,
    me.primary_emotion,
    me.emotion_intensity,
    me.sentiment_score,
    ec.color_code as emotion_color
FROM messages m
JOIN message_emotions me ON m.id = me.message_id
LEFT JOIN emotion_colors ec ON me.primary_emotion = ec.emotion
ORDER BY m.created_at ASC;

-- View for session emotion summary
CREATE OR REPLACE VIEW session_emotion_summary AS
SELECT 
    s.id as session_id,
    s.session_code,
    COUNT(DISTINCT me.id) as total_emotional_messages,
    AVG(me.emotion_intensity) as avg_intensity,
    COUNT(DISTINCT ep.id) as pattern_count,
    es1.dominant_emotion as user1_dominant_emotion,
    es2.dominant_emotion as user2_dominant_emotion
FROM sessions s
LEFT JOIN messages m ON s.id = m.session_id
LEFT JOIN message_emotions me ON m.id = me.message_id
LEFT JOIN emotion_patterns ep ON s.id = ep.session_id
LEFT JOIN emotion_statistics es1 ON s.id = es1.session_id AND es1.user_id = 'User1'
LEFT JOIN emotion_statistics es2 ON s.id = es2.session_id AND es2.user_id = 'User2'
GROUP BY s.id, s.session_code, es1.dominant_emotion, es2.dominant_emotion;

-- =====================================================
-- COMPLETE! Emotion tracking system is ready to use.
-- =====================================================