import React, { useRef, useEffect } from 'react';

export default function MessageTicker({ message, secondaryMessage }) {
  if (!message && !secondaryMessage) return null;

  const fullMessage = [message, secondaryMessage].filter(Boolean).join('   ★   ');

  return (
    <div
      className="border-t border-white/20 py-3 overflow-hidden"
      style={{
        WebkitBackdropFilter: 'blur(24px)',
        backdropFilter: 'blur(24px)',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.14) 100%)',
      }}
    >
      <TickerTrack text={fullMessage} />
    </div>
  );
}

function TickerTrack({ text }) {
  const trackRef = useRef(null);
  const animRef = useRef(null);
  const posRef = useRef(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    // Wait for first child to be measured
    const firstChild = track.children[0];
    const step = () => {
      posRef.current += 0.5; // px per frame — adjust for speed
      const singleWidth = firstChild.offsetWidth;
      if (posRef.current >= singleWidth) {
        posRef.current -= singleWidth;
      }
      track.style.transform = `translateX(-${posRef.current}px)`;
      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animRef.current);
  }, [text]);

  return (
    <div className="relative overflow-hidden">
      <div
        ref={trackRef}
        className="flex whitespace-nowrap will-change-transform"
        style={{ display: 'flex' }}
      >
        {/* Enough copies to fill any screen width seamlessly */}
        {[0, 1, 2, 3].map(i => (
          <span key={i} className="text-2xl font-heebo font-semibold mx-16" style={{ color: 'white', mixBlendMode: 'difference' }}>
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}