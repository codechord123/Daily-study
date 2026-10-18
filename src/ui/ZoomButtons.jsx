import { useEffect } from 'react';
import { useUI } from '../store/useUI';

// 확대·축소 버튼 (+ 키보드 +/-, 비행 중 마우스 휠)
export default function ZoomButtons({ wheel }) {
  const zoomBy = useUI((s) => s.zoomBy);
  useEffect(() => {
    const onKey = (e) => {
      if (e.target?.tagName === 'INPUT') return;
      if (e.key === '+' || e.key === '=') zoomBy(0.85);
      if (e.key === '-' || e.key === '_') zoomBy(1.18);
    };
    const onWheel = (e) => {
      if (e.target?.tagName !== 'CANVAS') return;
      zoomBy(e.deltaY > 0 ? 1.08 : 0.93);
    };
    // 두 손가락 벌리기·오므리기
    let pinch = null;
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const onTouchMove = (e) => {
      if (e.touches.length !== 2 || e.target?.tagName !== 'CANVAS') return (pinch = null);
      const d = dist(e.touches);
      if (pinch) zoomBy(Math.min(1.2, Math.max(0.83, pinch / d)));
      pinch = d;
    };
    const onTouchEnd = (e) => e.touches.length < 2 && (pinch = null);
    window.addEventListener('keydown', onKey);
    if (wheel) window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [zoomBy, wheel]);
  return (
    <div className="zoom panel" role="group" aria-label="확대 축소">
      <button className="zoom-btn" onClick={() => zoomBy(0.8)} aria-label="확대">＋</button>
      <button className="zoom-btn" onClick={() => zoomBy(1.25)} aria-label="축소">－</button>
    </div>
  );
}
