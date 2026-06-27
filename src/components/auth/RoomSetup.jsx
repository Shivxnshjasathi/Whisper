import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';
import { Heart, Users, Sparkles, Key, LogOut } from 'lucide-react';
import PageTransition from '../layout/PageTransition';

export default function RoomSetup() {
  const { createRoom, joinRoom, profile, signOut } = useAuth();
  const [mode, setMode] = useState('select'); // 'select' | 'create' | 'join'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Create Room state
  const [roomName, setRoomName] = useState('Our Diary');
  const [inviteCode, setInviteCode] = useState(''); // Generated after creation

  // Join Room state
  const [joinCode, setJoinCode] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    setLoading(true);
    setError(null);
    const result = await createRoom(roomName.trim());
    setLoading(false);
    
    if (result.error) {
      setError(result.error.message || 'Failed to create room.');
    } else {
      setInviteCode(result.inviteCode);
      setMode('created');
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setLoading(true);
    setError(null);
    const result = await joinRoom(joinCode.trim());
    setLoading(false);
    
    if (result.error) {
      setError(result.error.message || 'Failed to join. Invalid code?');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    alert('Code copied to clipboard!');
  };

  if (mode === 'created') {
    return (
      <PageTransition className="fixed inset-0 flex items-center justify-center p-6 app-bg">
        <div className="orb w-72 h-72 bg-emerald-500/10 top-0 left-0 animate-float" />
        <div className="animate-scale-in max-w-sm w-full mx-auto relative z-10 text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-[2rem] bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/30">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-[2rem] font-display font-semibold text-white mb-2">Diary Created!</h2>
          <p className="text-white/40 text-[14px] leading-relaxed mb-8">
            Your private space is ready. Now invite your partner to join you.
          </p>
          
          <div className="glass-card p-6 mb-8 text-center relative overflow-hidden group cursor-pointer" onClick={copyCode}>
            <div className="absolute inset-0 bg-white/0 hover:bg-white/5 transition-colors" />
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-2">Invite Code</p>
            <p className="text-2xl font-mono text-emerald-300 tracking-wider mb-2 font-semibold">
              {inviteCode.split('-')[0]}...
            </p>
            <p className="text-[13px] text-white/20 group-hover:text-emerald-400 transition-colors">Tap to copy full code</p>
          </div>

          <Button size="lg" className="w-full !rounded-2xl" onClick={() => window.location.reload()}>
            Enter Diary
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="fixed inset-0 flex flex-col items-center p-6 app-bg overflow-y-auto safe-top safe-bottom">
      <div className="orb w-72 h-72 bg-violet-500/8 top-0 right-0 animate-float" />
      <div className="orb w-56 h-56 bg-rose-500/8 bottom-0 left-0 animate-float" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-sm mx-auto relative z-10 mt-12 flex-1">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-semibold text-white mb-2">
            Welcome, {profile?.displayName || 'there'}!
          </h1>
          <p className="text-white/40 text-[14px] leading-relaxed">
            Let's set up your private space.
          </p>
        </div>

        {mode === 'select' && (
          <div className="space-y-4 animate-fade-in">
            <button 
              onClick={() => setMode('create')}
              className="w-full group glass-card p-6 text-left hover:bg-white/[0.05] transition-all active:scale-[0.98]"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-500/20 transition-colors">
                  <Sparkles className="w-6 h-6 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Create a new diary</h3>
                  <p className="text-[13px] text-white/30 leading-relaxed">Start fresh and invite your partner to join you.</p>
                </div>
              </div>
            </button>

            <button 
              onClick={() => setMode('join')}
              className="w-full group glass-card p-6 text-left hover:bg-white/[0.05] transition-all active:scale-[0.98]"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/20 transition-colors">
                  <Key className="w-6 h-6 text-violet-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Join an existing diary</h3>
                  <p className="text-[13px] text-white/30 leading-relaxed">Have an invite code? Enter it here to join.</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {mode === 'create' && (
          <form onSubmit={handleCreate} className="animate-slide-up space-y-4">
            <button type="button" onClick={() => {setMode('select'); setError(null);}} className="text-[13px] text-white/30 mb-2 flex items-center gap-1 hover:text-white/50">
              ← Back
            </button>
            <div className="relative group">
              <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/20 group-focus-within:text-rose-400/60" />
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Diary Name (e.g. Our Adventures)"
                required
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-white/20 text-[15px] focus:outline-none focus:border-rose-400/30 focus:bg-white/[0.06] transition-all"
              />
            </div>
            {error && <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded-xl">{error}</div>}
            <Button type="submit" size="lg" loading={loading} className="w-full !rounded-2xl mt-4">
              Create Diary
            </Button>
          </form>
        )}

        {mode === 'join' && (
          <form onSubmit={handleJoin} className="animate-slide-up space-y-4">
            <button type="button" onClick={() => {setMode('select'); setError(null);}} className="text-[13px] text-white/30 mb-2 flex items-center gap-1 hover:text-white/50">
              ← Back
            </button>
            <div className="relative group">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-white/20 group-focus-within:text-violet-400/60" />
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Paste Invite Code here"
                required
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-white placeholder-white/20 text-[15px] focus:outline-none focus:border-violet-400/30 focus:bg-white/[0.06] transition-all font-mono"
              />
            </div>
            {error && <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded-xl">{error}</div>}
            <Button type="submit" size="lg" loading={loading} className="w-full !rounded-2xl mt-4 bg-violet-600 hover:bg-violet-700">
              Join Diary
            </Button>
          </form>
        )}
      </div>
      
      <button 
        onClick={signOut}
        className="text-[12px] text-white/20 flex items-center gap-1.5 mt-8 hover:text-white/40 transition-colors"
      >
        <LogOut className="w-3.5 h-3.5" /> Sign Out
      </button>
    </PageTransition>
  );
}
