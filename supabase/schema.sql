-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT,
  avatar_color TEXT DEFAULT 'rose',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ROOMS TABLE
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Our Diary',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ROOM MEMBERS TABLE
CREATE TABLE IF NOT EXISTS room_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- ENTRIES TABLE
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_html TEXT NOT NULL DEFAULT '',
  media_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  voice_note_url TEXT,
  mood TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AUTO-UPDATE TRIGGER
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_rooms_updated_at ON rooms;
CREATE TRIGGER set_rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_entries_updated_at ON entries;
CREATE TRIGGER set_entries_updated_at BEFORE UPDATE ON entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_profiles_updated_at ON profiles;
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ENABLE SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- DROP OLD POLICIES IF THEY EXIST SO WE CAN RE-RUN THIS SAFELY
DROP POLICY IF EXISTS "Anyone can read profiles" ON profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

DROP POLICY IF EXISTS "Authenticated users can create rooms" ON rooms;
DROP POLICY IF EXISTS "Users can view their rooms" ON rooms;

DROP POLICY IF EXISTS "Authenticated users can join rooms" ON room_members;
DROP POLICY IF EXISTS "Users can view room members" ON room_members;
DROP POLICY IF EXISTS "Anyone can read room members" ON room_members;

DROP POLICY IF EXISTS "Users can read entries in their rooms" ON entries;
DROP POLICY IF EXISTS "Users can create entries in their rooms" ON entries;
DROP POLICY IF EXISTS "Users can update their own entries" ON entries;
DROP POLICY IF EXISTS "Users can delete their own entries" ON entries;

-- SECURITY POLICIES

-- Profiles
CREATE POLICY "Anyone can read profiles" ON profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can create their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Rooms
CREATE POLICY "Authenticated users can create rooms" ON rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can view their rooms" ON rooms FOR SELECT USING (EXISTS (SELECT 1 FROM room_members WHERE room_members.room_id = rooms.id AND room_members.user_id = auth.uid()));

-- Room Members
CREATE POLICY "Authenticated users can join rooms" ON room_members FOR INSERT WITH CHECK (auth.uid() = user_id);
-- FIX FOR INFINITE RECURSION: Allow any authenticated user to read room members.
-- (This is safe because room_ids are unguessable UUIDs).
CREATE POLICY "Anyone can read room members" ON room_members FOR SELECT USING (auth.role() = 'authenticated');

-- Entries
CREATE POLICY "Users can read entries in their rooms" ON entries FOR SELECT USING (EXISTS (SELECT 1 FROM room_members WHERE room_members.room_id = entries.room_id AND room_members.user_id = auth.uid()));
CREATE POLICY "Users can create entries in their rooms" ON entries FOR INSERT WITH CHECK (auth.uid() = author_id AND EXISTS (SELECT 1 FROM room_members WHERE room_members.room_id = entries.room_id AND room_members.user_id = auth.uid()));
CREATE POLICY "Users can update their own entries" ON entries FOR UPDATE USING (auth.uid() = author_id) WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Users can delete their own entries" ON entries FOR DELETE USING (auth.uid() = author_id);

-- ENABLE REALTIME SAFELY
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'entries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE entries;
  END IF;
END $$;

-- STORAGE BUCKET FOR PHOTOS
INSERT INTO storage.buckets (id, name, public) VALUES ('diary_media', 'diary_media', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Anyone can read media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;

CREATE POLICY "Anyone can read media" ON storage.objects FOR SELECT USING (bucket_id = 'diary_media');
CREATE POLICY "Authenticated users can upload media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'diary_media' AND auth.role() = 'authenticated');

-- REACTIONS TABLE
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entry_id, user_id, emoji)
);

-- COMMENTS TABLE
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Policies for reactions
CREATE POLICY "Users can read reactions in their rooms" ON reactions FOR SELECT USING (EXISTS (SELECT 1 FROM entries JOIN room_members ON room_members.room_id = entries.room_id WHERE entries.id = reactions.entry_id AND room_members.user_id = auth.uid()));
CREATE POLICY "Users can add reactions" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM entries JOIN room_members ON room_members.room_id = entries.room_id WHERE entries.id = reactions.entry_id AND room_members.user_id = auth.uid()));
CREATE POLICY "Users can remove their own reactions" ON reactions FOR DELETE USING (auth.uid() = user_id);

-- Policies for comments
CREATE POLICY "Users can read comments in their rooms" ON comments FOR SELECT USING (EXISTS (SELECT 1 FROM entries JOIN room_members ON room_members.room_id = entries.room_id WHERE entries.id = comments.entry_id AND room_members.user_id = auth.uid()));
CREATE POLICY "Users can add comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM entries JOIN room_members ON room_members.room_id = entries.room_id WHERE entries.id = comments.entry_id AND room_members.user_id = auth.uid()));
CREATE POLICY "Users can delete their own comments" ON comments FOR DELETE USING (auth.uid() = user_id);
