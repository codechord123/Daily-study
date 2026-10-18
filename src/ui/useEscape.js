import { useEffect, useRef } from 'react';

/** Esc 키로 닫기. 여러 창이 겹치면 가장 나중에 열린 것만 닫힌다 */
const stack = [];
let attached = false;
const onKey = (e) => {
  if (e.key !== 'Escape' || !stack.length) return;
  e.preventDefault();
  stack[stack.length - 1].current?.();
};

export function useEscape(fn, active = true) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    if (!active) return;
    if (!attached) {
      window.addEventListener('keydown', onKey);
      attached = true;
    }
    stack.push(ref);
    return () => {
      const i = stack.lastIndexOf(ref);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [active]);
}
