import { useEffect, useState } from 'react';
import { photoURL } from '../api/axios';

export default function Carousel({ photos = [], alt = '', aspectClass = 'aspect-[16/9]', rounded = 'rounded-lg' }) {
  const [idx, setIdx] = useState(0);
  const count = photos.length;

  useEffect(() => {
    if (idx >= count) setIdx(0);
  }, [count, idx]);

  if (count === 0) {
    return (
      <div className={`${aspectClass} ${rounded} flex w-full items-center justify-center bg-slate-200 text-slate-400`}>
        No photo
      </div>
    );
  }

  const go = (n) => setIdx((idx + n + count) % count);
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

  return (
    <div className={`group relative ${aspectClass} ${rounded} w-full overflow-hidden bg-slate-200`}>
      <img
        src={photoURL(photos[idx])}
        alt={alt}
        className="h-full w-full object-cover transition-opacity duration-200"
      />

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { stop(e); go(-1); }}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2 py-1 text-white opacity-0 transition hover:bg-black/70 group-hover:opacity-100"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={(e) => { stop(e); go(1); }}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 px-2 py-1 text-white opacity-0 transition hover:bg-black/70 group-hover:opacity-100"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { stop(e); setIdx(i); }}
                aria-label={`Photo ${i + 1}`}
                className={`h-1.5 w-1.5 rounded-full transition ${
                  i === idx ? 'bg-white' : 'bg-white/50 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
          <div className="absolute right-2 top-2 rounded bg-black/50 px-1.5 py-0.5 text-xs text-white">
            {idx + 1}/{count}
          </div>
        </>
      )}
    </div>
  );
}
