import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import EntryCard from '../components/timeline/EntryCard';
import Comments from '../components/timeline/Comments';

export default function EntryDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const entry = location.state?.entry;

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <p className="text-white/50 mb-4">Entry not found</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-white/10 rounded-xl">Go back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full w-full max-w-2xl mx-auto md:my-6 relative animate-fade-in pb-20 md:pb-0">
      <div className="flex items-center gap-2 p-4 pt-2">
        <button 
          onClick={() => navigate(-1)}
          className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center hover:bg-white/5 active:bg-white/10 transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white/70" />
        </button>
        <span className="text-sm font-semibold text-white/70">Back to Timeline</span>
      </div>
      <div className="px-4 pb-8">
        <EntryCard entry={entry} isDetailView={true} />
        <Comments entry={entry} />
      </div>
    </div>
  );
}
