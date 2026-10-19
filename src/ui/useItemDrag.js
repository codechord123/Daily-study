// 가방·상점의 소품 카드를 별 위로 끌어다 놓기.
// 마우스는 바로 끌고, 터치는 살짝 꾹 누른 뒤(0.28초) 끈다 — 그냥 쓸어 넘기면 목록이 스크롤된다.
import { useRef } from 'react';
import { useUI } from '../store/useUI';
import { sfx } from '../services/sound';

const LONG_PRESS = 280;

export function useItemDrag(itemId, from) {
  const suppressClick = useRef(false);
  const onPointerDown = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const touch = e.pointerType !== 'mouse';
    const sx = e.clientX;
    const sy = e.clientY;
    const id = e.pointerId;
    let started = false;
    let timer = null;
    const start = (x, y) => {
      started = true;
      suppressClick.current = true;
      sfx('rotate');
      navigator.vibrate?.(12);
      useUI.setState({ drag: { itemId, from, x, y, drop: false } });
    };
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', cancel);
      window.removeEventListener('touchmove', block);
    };
    const move = (ev) => {
      if (ev.pointerId !== id) return;
      if (!started) {
        const d = Math.hypot(ev.clientX - sx, ev.clientY - sy);
        if (touch) {
          if (d > 10) cleanup(); // 꾹 누르기 전에 움직이면 스크롤로 본다
          return;
        }
        if (d < 6) return;
        start(ev.clientX, ev.clientY);
      }
      useUI.setState((s) => (s.drag ? { drag: { ...s.drag, x: ev.clientX, y: ev.clientY } } : s));
    };
    const up = (ev) => {
      if (ev.pointerId !== id) return;
      if (started) useUI.setState((s) => (s.drag ? { drag: { ...s.drag, x: ev.clientX, y: ev.clientY, drop: true } } : s));
      cleanup();
    };
    const cancel = (ev) => {
      if (ev.pointerId !== id) return;
      if (started) useUI.setState({ drag: null });
      cleanup();
    };
    // 끄는 중엔 화면이 스크롤되지 않게
    const block = (ev) => started && ev.cancelable && ev.preventDefault();
    if (touch) timer = setTimeout(() => start(sx, sy), LONG_PRESS);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', cancel);
    window.addEventListener('touchmove', block, { passive: false });
  };
  // 끌어 놓은 뒤 따라오는 클릭은 무시 (카드를 고른 것으로 치지 않게)
  const onClickCapture = (e) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    e.preventDefault();
    e.stopPropagation();
  };
  return { onPointerDown, onClickCapture, onContextMenu: (e) => e.preventDefault() };
}
