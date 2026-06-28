import { useComments, useAddComment } from '../../hooks/useEntries';
import { Send, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../ui/Avatar';

export default function Comments({ entry }) {
  const { data: comments = [] } = useComments(entry.id);
  const addComment = useAddComment();
  const [content, setContent] = useState('');
  const { user } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    addComment.mutate({ entryId: entry.id, content: content.trim() }, {
      onSuccess: () => setContent('')
    });
  };

  return (
    <div className="mt-6 px-2 pb-[120px]">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-4 h-4 text-white/40" />
        <h3 className="text-sm font-semibold text-white/70">Comments</h3>
      </div>
      
      <div className="space-y-4 mb-6">
        {comments.map((comment) => {
          const isMe = comment.user_id === user.id;
          const authorName = isMe ? 'You' : 'Partner';
          return (
            <div key={comment.id} className="flex flex-col gap-1 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">{authorName}</span>
                <span className="text-[10px] text-white/20">•</span>
                <span className="text-[10px] text-white/20">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className={`p-3 rounded-2xl text-sm w-fit max-w-[85%] ${isMe ? 'bg-accent-500/10 text-accent-100 border border-accent-500/20 rounded-tl-sm' : 'glass-card text-white/80 rounded-tr-sm'}`}>
                {comment.content}
              </div>
            </div>
          );
        })}
        
        {comments.length === 0 && (
          <p className="text-white/30 text-sm text-center py-4">No comments yet. Start the conversation!</p>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-plum-950/80 backdrop-blur-xl border-t border-white/10 p-4 safe-bottom z-10 md:absolute md:rounded-b-[24px]">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 relative max-w-2xl mx-auto">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a comment..."
            className="flex-1 bg-white/[0.05] border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder-white/30 focus:outline-none focus:border-accent-400/50 focus:bg-white/10 transition-colors"
          />
          <button
            type="submit"
            disabled={!content.trim() || addComment.isPending}
            className="absolute right-2 w-8 h-8 flex items-center justify-center text-accent-400 hover:bg-accent-400/10 rounded-xl disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4 -ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
