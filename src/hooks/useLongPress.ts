// src/hooks/useLongPress.ts
import { useCallback, useRef } from 'react';

interface UseLongPressOptions {
  onLongPress: () => void;
  onClick?: () => void;
  duration?: number;
}

export function useLongPress(
  options: UseLongPressOptions
) {
  const { onLongPress, onClick, duration = 500 } = options;
  const timeout = useRef<NodeJS.Timeout>();
  const target = useRef<EventTarget | null>();

  const start = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    target.current = event.target;
    
    timeout.current = setTimeout(() => {
      onLongPress();
    }, duration);
  }, [onLongPress, duration]);

  const clear = useCallback((event: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
    timeout.current && clearTimeout(timeout.current);
    
    if (shouldTriggerClick && onClick && target.current === event.target) {
      onClick();
    }
  }, [onClick]);

  return {
    onMouseDown: start,
    onTouchStart: start,
    onMouseUp: clear,
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchEnd: clear,
  };
}
