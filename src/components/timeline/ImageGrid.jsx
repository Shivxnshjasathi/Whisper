import { useState } from 'react';
import { X } from 'lucide-react';

export default function ImageGrid({ urls = [] }) {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  if (urls.length === 0) return null;

  const gridClass = urls.length === 1
    ? 'grid-cols-1'
    : 'grid-cols-2';

  return (
    <>
      <div className={`grid ${gridClass} gap-1.5 rounded-xl overflow-hidden`}>
        {urls.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightboxIndex(i)}
            className={`
              relative overflow-hidden bg-white/5 
              ${urls.length === 1 ? 'aspect-[4/3]' : ''}
              ${urls.length === 2 ? 'aspect-square' : ''}
              ${urls.length === 3 && i === 0 ? 'row-span-2 aspect-auto' : ''}
              ${urls.length === 3 && i > 0 ? 'aspect-square' : ''}
              ${urls.length >= 4 ? 'aspect-square' : ''}
              hover:opacity-90 transition-opacity
            `}
          >
            <img
              src={url}
              alt={`Photo ${i + 1}`}
              loading="lazy"
              className="w-full h-full object-cover"
            />
            {urls.length > 4 && i === 3 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white text-lg font-semibold">
                  +{urls.length - 4}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10 safe-top"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          <img
            src={urls[lightboxIndex]}
            alt={`Photo ${lightboxIndex + 1}`}
            className="max-w-full max-h-full object-contain p-4"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Dots indicator */}
          {urls.length > 1 && (
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2 safe-bottom">
              {urls.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(i);
                  }}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === lightboxIndex
                      ? 'bg-white scale-125'
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
