import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { queueEntry, getPendingEntries } from '../lib/syncManager';
import { useAuth } from '../contexts/AuthContext';

const PAGE_SIZE = 20;

/**
 * Fetch a page of timeline entries from Supabase.
 */
async function fetchEntries({ roomId, pageParam = 0 }) {
  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  return data || [];
}

/**
 * Hook: Infinite-scroll timeline with offline support.
 */
export function useTimeline(roomId) {
  return useInfiniteQuery({
    queryKey: ['timeline', roomId],
    queryFn: ({ pageParam }) => fetchEntries({ roomId, pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === PAGE_SIZE ? allPages.length : undefined;
    },
    enabled: !!roomId,
    staleTime: 5 * 60 * 1000,       // 5 minutes
    gcTime: 30 * 60 * 1000,         // 30 minutes
    networkMode: 'offlineFirst',
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook: Get pending (unsynced) entries from local storage.
 */
export function usePendingEntries() {
  return useQuery({
    queryKey: ['pending-entries'],
    queryFn: getPendingEntries,
    staleTime: 10 * 1000, // 10 seconds
    refetchInterval: 30 * 1000, // Refresh every 30s
  });
}

/**
 * Hook: Create a new entry (online → Supabase, offline → local queue).
 */
export function useCreateEntry() {
  const queryClient = useQueryClient();
  const { user, profile } = useAuth();

  return useMutation({
    mutationFn: async ({ contentHtml, mediaFiles = [], voiceBlob = null, mood = null }) => {
      const roomId = profile?.roomId;
      if (!roomId) throw new Error('No room found');

      // If offline, queue the entry locally
      if (!navigator.onLine) {
        const localId = await queueEntry(
          {
            room_id: roomId,
            author_id: user.id,
            content_html: contentHtml,
            mood,
          },
          mediaFiles,
          voiceBlob
        );
        return { localId, isPending: true };
      }

      // Online path: upload media first, then insert entry
      const mediaUrls = [];
      let voiceNoteUrl = null;

      // Upload photos
      for (const file of mediaFiles) {
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${roomId}/${user.id}/${timestamp}_${safeName}`;

        const { data, error: uploadError } = await supabase.storage
          .from('diary_media')
          .upload(path, file, { contentType: file.type });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('diary_media')
          .getPublicUrl(data.path);

        mediaUrls.push(urlData.publicUrl);
      }

      // Upload voice note
      if (voiceBlob) {
        const timestamp = Date.now();
        const path = `${roomId}/${user.id}/${timestamp}_voice.webm`;

        const { data, error: uploadError } = await supabase.storage
          .from('diary_media')
          .upload(path, voiceBlob, { contentType: voiceBlob.type || 'audio/webm' });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('diary_media')
          .getPublicUrl(data.path);

        voiceNoteUrl = urlData.publicUrl;
      }

      // Insert the entry
      const { data, error } = await supabase
        .from('entries')
        .insert({
          room_id: roomId,
          author_id: user.id,
          content_html: contentHtml,
          media_urls: mediaUrls,
          voice_note_url: voiceNoteUrl,
          mood,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
      queryClient.invalidateQueries({ queryKey: ['pending-entries'] });
    },
  });
}

/**
 * Hook: Subscribe to real-time entry inserts.
 */
export function useRealtimeEntries(roomId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`entries:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'entries',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          // Prepend the new entry to the timeline cache
          queryClient.setQueryData(['timeline', roomId], (old) => {
            if (!old) return old;
            const newEntry = payload.new;
            return {
              ...old,
              pages: old.pages.map((page, i) =>
                i === 0 ? [newEntry, ...page] : page
              ),
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryClient]);
}

/**
 * Hook: Update an existing entry.
 */
export function useUpdateEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, contentHtml, mood = null }) => {
      const { data, error } = await supabase
        .from('entries')
        .update({ content_html: contentHtml, mood })
        .eq('id', entryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}

/**
 * Hook: Delete an existing entry.
 */
export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (entryId) => {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      return entryId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timeline'] });
    },
  });
}
