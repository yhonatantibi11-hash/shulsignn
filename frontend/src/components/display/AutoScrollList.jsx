import React, { useRef, useEffect, useState } from 'react';

// Gap (px) between loop copies — matches the `space-y-3` spacing used by the lists,
// so the last item of one cycle stays spaced from the first item of the next.
const GAP_PX = 12;

/**
 * AutoScrollList - wraps children in a container that auto-scrolls vertically
 * when content overflows the container height. Stops automatically when content fits.
 */
export default function AutoScrollList({ children, speed = 25, className = '', manualScroll = false }) {
  const containerRef = useRef(null);
  const contentRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const singleHeightRef = useRef(0);

  // Measure single-copy height vs container to decide if scroll is needed.
  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    const measure = () => {
      // firstElementChild is always the original (non-duplicate) content copy
      const first = content.firstElementChild;
      const singleHeight = first ? first.scrollHeight : content.scrollHeight;
      singleHeightRef.current = singleHeight;
      // +1px tolerance to avoid toggling when content is exactly the container height
      const overflow = singleHeight > container.clientHeight + 1;
      setShouldScroll(overflow);
      if (!overflow) content.style.transform = 'translateY(0)';
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    ro.observe(content);
    return () => ro.disconnect();
  }, []);

  // Drive the seamless vertical scroll.
  useEffect(() => {
    if (!shouldScroll) return;
    const content = contentRef.current;
    if (!content) return;

    let pos = 0;
    let animId;
    const pxPerFrame = Math.max(speed / 60, 0.25);

    const step = () => {
      pos += pxPerFrame;
      // Reset after one full copy + the inter-copy gap, so copy 2's top snaps to
      // the container top exactly where copy 1's top was — seamless loop.
      const resetPoint = singleHeightRef.current + GAP_PX;
      if (pos >= resetPoint) pos = 0;
      content.style.transform = `translateY(-${pos}px)`;
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [shouldScroll, speed]);

  if (manualScroll) {
    return (
      <div className={`flex-1 overflow-y-auto min-h-0 scrollbar-hide ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex-1 overflow-hidden min-h-0 ${className}`}
    >
      <div ref={contentRef} className="will-change-transform">
        <div>{children}</div>
        {shouldScroll && (
          <>
            {/* Spacer so the last item of the current cycle is separated from
                the first item of the duplicated cycle below. */}
            <div style={{ height: GAP_PX }} aria-hidden="true" />
            <div aria-hidden="true">{children}</div>
          </>
        )}
      </div>
    </div>
  );
}