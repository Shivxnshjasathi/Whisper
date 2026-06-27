-- =============================================
-- Whisper — Storage Bucket & RLS Policies
-- Run this in your Supabase SQL Editor
-- =============================================

-- Create the diary_media storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'diary_media',
  'diary_media',
  true,  -- Public read access for media URLs
  52428800,  -- 50MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg']
)
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- STORAGE RLS POLICIES
-- =============================================

-- Allow authenticated room members to upload files
-- Path structure: {room_id}/{user_id}/{filename}
CREATE POLICY "Room members can upload media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'diary_media'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM room_members
      WHERE room_members.room_id = (storage.foldername(name))[1]::uuid
      AND room_members.user_id = auth.uid()
    )
  );

-- Allow authenticated room members to read media files
CREATE POLICY "Room members can view media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'diary_media'
    AND (
      -- Public bucket allows reads, but we still scope to room members
      auth.role() = 'authenticated'
      AND EXISTS (
        SELECT 1 FROM room_members
        WHERE room_members.room_id = (storage.foldername(name))[1]::uuid
        AND room_members.user_id = auth.uid()
      )
    )
  );

-- Allow users to delete only their own uploads
CREATE POLICY "Users can delete their own media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'diary_media'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
