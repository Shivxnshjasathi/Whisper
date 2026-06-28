-- SQL Migration to add new features to Whisper

-- Add new columns to the entries table
ALTER TABLE entries 
  ADD COLUMN IF NOT EXISTS location_lat FLOAT,
  ADD COLUMN IF NOT EXISTS location_lng FLOAT,
  ADD COLUMN IF NOT EXISTS location_name TEXT,
  ADD COLUMN IF NOT EXISTS weather_condition TEXT,
  ADD COLUMN IF NOT EXISTS weather_temp FLOAT,
  ADD COLUMN IF NOT EXISTS voice_transcript TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
