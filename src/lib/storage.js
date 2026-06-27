import localforage from 'localforage';

// Pending entries queue (entries waiting to be synced)
export const pendingEntriesStore = localforage.createInstance({
  name: 'whisper',
  storeName: 'pending_entries',
  description: 'Entries waiting to be synced to Supabase',
});

// Pending media blobs (files waiting to be uploaded)
export const pendingMediaStore = localforage.createInstance({
  name: 'whisper',
  storeName: 'pending_media',
  description: 'Media files waiting to be uploaded',
});

// Cached timeline data (for offline viewing)
export const cachedTimelineStore = localforage.createInstance({
  name: 'whisper',
  storeName: 'cached_timeline',
  description: 'Cached timeline entries for offline viewing',
});

// User preferences
export const preferencesStore = localforage.createInstance({
  name: 'whisper',
  storeName: 'preferences',
  description: 'User preferences and settings',
});
