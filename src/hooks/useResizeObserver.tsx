import { useEffect, useRef } from 'react';

export const useResizeObserver = (
  ref: React.RefObject<HTMLElement>,
  callback: ResizeObserverCallback
) => {
  const observerRef = useRef<ResizeObserver | null>(null);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!ref.current) return;

    observerRef.current = new ResizeObserver((entries, observer) => {
      callbackRef.current(entries, observer);
    });

    observerRef.current.observe(ref.current);

    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [ref]);
};
