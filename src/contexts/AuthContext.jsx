import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user's room membership
  const fetchUserRoom = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('room_members')
        .select('room_id, rooms(id, name)')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.warn('Could not fetch room:', error.message);
        return null;
      }
      return data;
    } catch {
      return null;
    }
  };

  // Fetch partner info from the same room
  const fetchPartner = async (userId, roomId) => {
    if (!roomId) return null;
    try {
      const { data } = await supabase
        .from('room_members')
        .select('user_id, profiles(display_name, avatar_color)')
        .eq('room_id', roomId)
        .neq('user_id', userId)
        .limit(1)
        .maybeSingle();
      return data;
    } catch {
      return null;
    }
  };

  // Fetch or create profile
  const fetchOrCreateProfile = async (authUser) => {
    try {
      // Try to get existing profile
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (existingProfile) return existingProfile;

      // Create a new profile
      const displayName = authUser.user_metadata?.display_name
        || authUser.email?.split('@')[0]
        || 'User';

      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: authUser.id,
          display_name: displayName,
          email: authUser.email,
          avatar_color: getRandomColor(),
        })
        .select()
        .single();

      return newProfile;
    } catch {
      // If profiles table doesn't exist yet, return a fallback
      return {
        display_name: authUser.email?.split('@')[0] || 'User',
        avatar_color: 'rose',
      };
    }
  };

  const setupUser = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setProfile(null);
      return;
    }

    setUser(authUser);
    setError(null);

    // Fetch or create profile
    const userProfile = await fetchOrCreateProfile(authUser);

    // Fetch room membership
    const roomData = await fetchUserRoom(authUser.id);

    setProfile({
      displayName: userProfile?.display_name || authUser.email?.split('@')[0],
      email: authUser.email,
      avatarColor: userProfile?.avatar_color || 'rose',
      roomId: roomData?.room_id || null,
      roomName: roomData?.rooms?.name || null,
    });
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await setupUser(session.user);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await setupUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with magic link
  const signInWithMagicLink = async (email) => {
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      setError(error.message);
      return { error };
    }
    return { error: null };
  };

  // Sign in with password
  const signInWithPassword = async (email, password) => {
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password,
    });
    if (error) {
      setError(error.message);
      return { error };
    }
    return { error: null };
  };

  // Sign up with password + display name
  const signUp = async (email, password, displayName) => {
    setError(null);
    const { error } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: displayName || email.split('@')[0],
        },
      },
    });
    if (error) {
      setError(error.message);
      return { error };
    }
    return { error: null };
  };

  // Create or join a room (couple pairing)
  const createRoom = async (roomName = 'Our Diary') => {
    setError(null);
    try {
      // Generate the UUID on the client so we don't need .select() 
      // which would trigger the SELECT policy before we are in room_members.
      const newRoomId = crypto.randomUUID();

      const { error: roomErr } = await supabase
        .from('rooms')
        .insert({ id: newRoomId, name: roomName });

      if (roomErr) throw roomErr;

      // Add self as member
      await supabase.from('room_members').insert({
        room_id: newRoomId,
        user_id: user.id,
      });

      setProfile(prev => ({ ...prev, roomId: newRoomId, roomName: roomName }));
      return { room: { id: newRoomId, name: roomName }, inviteCode: newRoomId };
    } catch (err) {
      setError(err.message);
      return { error: err };
    }
  };

  // Join a room via invite code (room ID)
  const joinRoom = async (roomId) => {
    setError(null);
    try {
      // Check room exists
      const { data: room, error: roomErr } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomErr) throw new Error('Room not found. Check the invite code.');

      // Join the room
      const { error: joinErr } = await supabase.from('room_members').insert({
        room_id: roomId,
        user_id: user.id,
      });

      if (joinErr) {
        if (joinErr.code === '23505') {
          // Already a member
          setProfile(prev => ({ ...prev, roomId: room.id, roomName: room.name }));
          return { room };
        }
        throw joinErr;
      }

      setProfile(prev => ({ ...prev, roomId: room.id, roomName: room.name }));
      return { room };
    } catch (err) {
      setError(err.message);
      return { error: err };
    }
  };

  // Sign out
  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setError(null);
  };

  const value = {
    user,
    profile,
    loading,
    error,
    signInWithMagicLink,
    signInWithPassword,
    signUp,
    signOut,
    createRoom,
    joinRoom,
    isAuthenticated: !!user,
    hasRoom: !!profile?.roomId,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function getRandomColor() {
  const colors = ['rose', 'violet', 'blue', 'emerald', 'amber', 'pink', 'cyan'];
  return colors[Math.floor(Math.random() * colors.length)];
}
