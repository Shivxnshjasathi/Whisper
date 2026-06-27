import { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';

export default function PhotoPicker({ photos = [], onAdd, onRemove }) {
  const inputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onAdd(files);
    }
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <div>
      {/* Photo previews */}
      {photos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
          {photos.map((photo, i) => (
            <div key={i} className="relative flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden group">
              <img
                src={URL.createObjectURL(photo)}
                alt={`Selected ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
              {/* Always visible on mobile */}
              <button
                type="button"
                onClick={() => onRemove(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center md:hidden"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}

          {/* Add more button */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex-shrink-0 w-20 h-20 rounded-xl border-2 border-dashed border-white/10 flex items-center justify-center text-white/30 hover:text-white/50 hover:border-white/20 transition-all"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Add photo button (shown when no photos selected) */}
      {photos.length === 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-white/40 hover:text-white/60 hover:bg-white/5 transition-all text-sm"
        >
          <ImagePlus className="w-4 h-4" />
          Add Photos
        </button>
      )}
    </div>
  );
}
