import { supabase } from './supabase';
import { pendingEntriesStore, pendingMediaStore } from './storage';

/**
 * SyncManager — Offline-first entry queue and background sync.
 *
 * When offline:
 *   1. Entries + media blobs are saved to IndexedDB
 *   2. A unique local ID is used as the key
 *
 * When back online:
 *   1. Media blobs are uploaded to Supabase Storage
 *   2. Entry records are inserted into the entries table
 *   3. Successfully synced entries are removed from the local queue
 */

// Generate a unique local ID for pending entries
function generateLocalId() {
  return `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Queue a new entry for later sync.
 * @param {Object} entry - The entry data (room_id, author_id, content_html, mood)
 * @param {File[]} mediaFiles - Array of image File objects
 * @param {Blob|null} voiceBlob - Voice recording blob
 * @returns {string} The local ID of the queued entry
 */
export async function queueEntry(entry, mediaFiles = [], voiceBlob = null) {
  const localId = generateLocalId();

  // Store the entry metadata
  await pendingEntriesStore.setItem(localId, {
    ...entry,
    localId,
    mediaFileCount: mediaFiles.length,
    hasVoiceNote: !!voiceBlob,
    queuedAt: new Date().toISOString(),
  });

  // Store media files as blobs
  for (let i = 0; i < mediaFiles.length; i++) {
    const file = mediaFiles[i];
    const arrayBuffer = await file.arrayBuffer();
    await pendingMediaStore.setItem(`${localId}_photo_${i}`, {
      buffer: arrayBuffer,
      name: file.name,
      type: file.type,
    });
  }

  // Store voice note blob
  if (voiceBlob) {
    const arrayBuffer = await voiceBlob.arrayBuffer();
    await pendingMediaStore.setItem(`${localId}_voice`, {
      buffer: arrayBuffer,
      name: `voice_${Date.now()}.webm`,
      type: voiceBlob.type || 'audio/webm',
    });
  }

  return localId;
}

/**
 * Upload a single media file to Supabase Storage.
 * @param {string} roomId
 * @param {string} userId
 * @param {ArrayBuffer} buffer
 * @param {string} fileName
 * @param {string} mimeType
 * @returns {string} Public URL of the uploaded file
 */
async function uploadMediaFile(roomId, userId, buffer, fileName, mimeType) {
  const timestamp = Date.now();
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${roomId}/${userId}/${timestamp}_${safeName}`;

  const { data, error } = await supabase.storage
    .from('diary_media')
    .upload(path, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('diary_media')
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Sync a single pending entry to Supabase.
 * @param {string} localId
 * @returns {boolean} true if sync succeeded
 */
async function syncSingleEntry(localId) {
  try {
    const entry = await pendingEntriesStore.getItem(localId);
    if (!entry) return true; // Already synced

    const mediaUrls = [];
    let voiceNoteUrl = null;

    // Upload photos
    for (let i = 0; i < entry.mediaFileCount; i++) {
      const mediaData = await pendingMediaStore.getItem(`${localId}_photo_${i}`);
      if (mediaData) {
        const url = await uploadMediaFile(
          entry.room_id,
          entry.author_id,
          mediaData.buffer,
          mediaData.name,
          mediaData.type
        );
        mediaUrls.push(url);
        await pendingMediaStore.removeItem(`${localId}_photo_${i}`);
      }
    }

    // Upload voice note
    if (entry.hasVoiceNote) {
      const voiceData = await pendingMediaStore.getItem(`${localId}_voice`);
      if (voiceData) {
        voiceNoteUrl = await uploadMediaFile(
          entry.room_id,
          entry.author_id,
          voiceData.buffer,
          voiceData.name,
          voiceData.type
        );
        await pendingMediaStore.removeItem(`${localId}_voice`);
      }
    }

    // Insert the entry into Supabase
    const { error } = await supabase.from('entries').insert({
      room_id: entry.room_id,
      author_id: entry.author_id,
      content_html: entry.content_html,
      media_urls: mediaUrls,
      voice_note_url: voiceNoteUrl,
      mood: entry.mood || null,
      location_lat: entry.location_lat || null,
      location_lng: entry.location_lng || null,
      location_name: entry.location_name || null,
      weather_condition: entry.weather_condition || null,
      weather_temp: entry.weather_temp || null,
      voice_transcript: entry.voice_transcript || null,
    });

    if (error) throw error;

    // Clean up the local entry
    await pendingEntriesStore.removeItem(localId);
    return true;
  } catch (err) {
    console.error(`[SyncManager] Failed to sync entry ${localId}:`, err);
    return false;
  }
}

/**
 * Sync all pending entries to Supabase.
 * Called when the device comes back online.
 * @returns {{ synced: number, failed: number }}
 */
export async function syncPendingEntries() {
  const keys = await pendingEntriesStore.keys();
  if (keys.length === 0) return { synced: 0, failed: 0 };

  console.log(`[SyncManager] Syncing ${keys.length} pending entries...`);

  let synced = 0;
  let failed = 0;

  for (const key of keys) {
    const success = await syncSingleEntry(key);
    if (success) synced++;
    else failed++;
  }

  console.log(`[SyncManager] Sync complete: ${synced} synced, ${failed} failed`);
  return { synced, failed };
}

/**
 * Get the count of pending (unsynced) entries.
 * @returns {number}
 */
export async function getPendingCount() {
  const keys = await pendingEntriesStore.keys();
  return keys.length;
}

/**
 * Get all pending entries for display in the timeline.
 * @returns {Object[]}
 */
export async function getPendingEntries() {
  const keys = await pendingEntriesStore.keys();
  const entries = [];

  for (const key of keys) {
    const entry = await pendingEntriesStore.getItem(key);
    if (entry) {
      entries.push({
        ...entry,
        id: entry.localId,
        isPending: true,
        created_at: entry.queuedAt,
      });
    }
  }

  // Sort newest first
  entries.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return entries;
}

/**
 * Initialize the sync manager.
 * Sets up the online event listener for background sync.
 */
export function initSyncManager() {
  const handleOnline = async () => {
    console.log('[SyncManager] Device is online. Starting sync...');
    await syncPendingEntries();
  };

  window.addEventListener('online', handleOnline);

  // If already online, sync any pending entries from a previous session
  if (navigator.onLine) {
    syncPendingEntries();
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
