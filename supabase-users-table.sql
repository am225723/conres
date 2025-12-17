-- =====================================================
-- USERS TABLE FOR PIN-BASED AUTHENTICATION
-- Run this in Supabase SQL Editor
-- =====================================================

-- Users table with PIN authentication
CREATE TABLE IF NOT EXISTS conres_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    pin VARCHAR(60) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_email UNIQUE (email)
);

-- Enable RLS
ALTER TABLE conres_users ENABLE ROW LEVEL SECURITY;

-- NO SELECT policy - users cannot read the table directly
-- NO UPDATE policy - users cannot update the table directly
-- All operations go through SECURITY DEFINER functions

-- Index for faster PIN lookups (used by RPC)
CREATE INDEX IF NOT EXISTS idx_users_pin ON conres_users(pin);
CREATE INDEX IF NOT EXISTS idx_users_email ON conres_users(email);

-- =====================================================
-- SECURE PIN VALIDATION FUNCTION (RPC)
-- This function validates PIN server-side without exposing data
-- Uses SECURITY DEFINER to bypass RLS
-- =====================================================

CREATE OR REPLACE FUNCTION validate_pin(input_pin VARCHAR)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_record RECORD;
BEGIN
    SELECT id, name, email, role, is_active
    INTO user_record
    FROM conres_users
    WHERE pin = input_pin AND is_active = true
    LIMIT 1;

    IF user_record IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid PIN');
    END IF;

    UPDATE conres_users
    SET last_login = NOW()
    WHERE id = user_record.id;

    RETURN json_build_object(
        'success', true,
        'user', json_build_object(
            'id', user_record.id,
            'name', user_record.name,
            'email', user_record.email,
            'role', user_record.role
        )
    );
END;
$$;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION validate_pin(VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION validate_pin(VARCHAR) TO authenticated;

-- =====================================================
-- SAMPLE USERS (for testing - use hashed PINs in production)
-- =====================================================

-- Insert a sample admin user (PIN: 123456)
INSERT INTO conres_users (name, email, pin, role) 
VALUES ('Admin User', 'admin@example.com', '123456', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert a sample regular user (PIN: 654321)
INSERT INTO conres_users (name, email, pin, role) 
VALUES ('Demo User', 'user@example.com', '654321', 'user')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- CLEANUP: Remove any overly permissive policies if they exist
-- =====================================================
DROP POLICY IF EXISTS "allow_auth_select" ON conres_users;
DROP POLICY IF EXISTS "allow_login_update" ON conres_users;
