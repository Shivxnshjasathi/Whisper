import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for uploading media files to Supabase Storage.
 */
export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const uploadFile = useCallback(async (file, roomId, userId) => {
    setError(null);
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${roomId}/${userId}/${timestamp}_${safeName}`;

    const { data, error: uploadError } = await supabase.storage
      .from('diary_media')
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      setError(uploadError.message);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('diary_media')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }, []);

  const uploadMultiple = useCallback(async (files, roomId, userId) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    const urls = [];
    const total = files.length;

    try {
      for (let i = 0; i < total; i++) {
        const url = await uploadFile(files[i], roomId, userId);
        urls.push(url);
        setProgress(Math.round(((i + 1) / total) * 100));
      }
      return urls;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setUploading(false);
    }
  }, [uploadFile]);

  return {
    uploadFile,
    uploadMultiple,
    uploading,
    progress,
    error,
  };
}
