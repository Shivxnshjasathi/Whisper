-- =============================================
-- Whisper — Seed Data
-- Run this AFTER both users have signed up
-- Replace the UUIDs with actual user IDs from auth.users
-- =============================================

-- Step 1: Create the shared room
INSERT INTO rooms (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Our Whispers')
ON CONFLICT (id) DO NOTHING;

-- Step 2: Add both users as room members
-- IMPORTANT: Replace these UUIDs with the actual user IDs from your Supabase auth.users table
-- You can find them in the Supabase Dashboard under Authentication > Users

-- INSERT INTO room_members (room_id, user_id)
-- VALUES 
--   ('00000000-0000-0000-0000-000000000001', 'SHIVANSH_USER_UUID_HERE'),
--   ('00000000-0000-0000-0000-000000000001', 'KUHU_USER_UUID_HERE')
-- ON CONFLICT (room_id, user_id) DO NOTHING;

-- =============================================
-- AUTO-SEED: Alternative approach
-- This function auto-adds new users to the default room
-- Useful so you don't have to manually add UUIDs
-- =============================================

CREATE OR REPLACE FUNCTION auto_add_to_default_room()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO room_members (room_id, user_id)
  VALUES ('00000000-0000-0000-0000-000000000001', NEW.id)
  ON CONFLICT (room_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: auto-add any new auth user to the default room
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auto_add_to_default_room();
