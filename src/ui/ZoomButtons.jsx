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
    window.addEventListener('keydown', onKey);
    if (wheel) window.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
    };
  }, [zoomBy, wheel]);
  return (
    <div className="zoom panel" role="group" aria-label="확대 축소">
      <button className="zoom-btn" onClick={() => zoomBy(0.8)} aria-label="확대">＋</button>
      <button className="zoom-btn" onClick={() => zoomBy(1.25)} aria-label="축소">－</button>
    </div>
  );
}
