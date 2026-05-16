import { useEffect, useState } from 'react';
import { photoURL } from '../api/axios';

const ASPECT = {
  '16x9': { paddingTop: '56.25%' },
  '1x1': { paddingTop: '100%' },
};

export default function Carousel({
  photos = [],
  alt = '',
  aspect = '16x9',
  rounded = 'rounded',
}) {
  const [idx, setIdx] = useState(0);
  const count = photos.length;

  useEffect(() => {
    if (idx >= count) setIdx(0);
  }, [count, idx]);

  const wrapStyle = {
    position: 'relative',
    width: '100%',
    background: '#e9ecef',
    overflow: 'hidden',
    ...ASPECT[aspect],
  };

  if (count === 0) {
    return (
      <div className={`${rounded} d-flex align-items-center justify-content-center text-secondary`} style={wrapStyle}>
        <span style={{ position: 'absolute' }}>No photo</span>
      </div>
    );
  }

  const go = (n) => setIdx((idx + n + count) % count);
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

  return (
    <div className={`${rounded} carousel-overlay`} style={wrapStyle}>
      <img
        src={photoURL(photos[idx])}
        alt={alt}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
      />
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { stop(e); go(-1); }}
            aria-label="Previous"
            className="ctrl btn btn-dark btn-sm position-absolute top-50 translate-middle-y rounded-circle"
            style={{ left: 8, opacity: 0 }}
          >
            <i className="bi bi-chevron-left" />
          </button>
          <button
            type="button"
            onClick={(e) => { stop(e); go(1); }}
            aria-label="Next"
            className="ctrl btn btn-dark btn-sm position-absolute top-50 translate-middle-y rounded-circle"
            style={{ right: 8, opacity: 0 }}
          >
            <i className="bi bi-chevron-right" />
          </button>
          <div className="position-absolute start-50 translate-middle-x d-flex gap-1" style={{ bottom: 8 }}>
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { stop(e); setIdx(i); }}
                aria-label={`Photo ${i + 1}`}
                className="border-0 p-0 rounded-circle"
                style={{
                  width: 8,
                  height: 8,
                  background: i === idx ? 'white' : 'rgba(255,255,255,0.5)',
                }}
              />
            ))}
          </div>
          <span className="position-absolute badge bg-dark bg-opacity-50" style={{ top: 8, right: 8 }}>
            {idx + 1}/{count}
          </span>
        </>
      )}
    </div>
  );
}
