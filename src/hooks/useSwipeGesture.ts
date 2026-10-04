import { useEffect, useRef, RefObject } from 'react';

export interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
  minRatio?: number;
  disabled?: boolean;
}

/**
 * Custom hook to detect horizontal swipe gestures on mobile and touch-enabled devices.
 * - onSwipeRight: typically used for "back" / previous page / previous space navigation
 * - onSwipeLeft: typically used for "forward" / next page / next space navigation
 * 
 * Features:
 * - Ref-stabilized callbacks: immune to parent component re-renders during gesture tracking
 * - Natural thumb-arc angle tolerance (minRatio = 1.15)
 * - Calibrated threshold (default 40px)
 * - Safe for interactive cards: buttons and cards don't block full-screen swipes
 * - Attaches to window by default for full-viewport coverage
 */
export function useSwipeGesture<T extends HTMLElement = HTMLElement>(
  targetRef: RefObject<T | null> | null,
  config: SwipeConfig
) {
  const { onSwipeLeft, onSwipeRight, threshold = 40, minRatio = 1.15, disabled = false } = config;

  // Keep latest config in ref so listeners don't need to detach/re-attach on every re-render
  const configRef = useRef<SwipeConfig>({
    onSwipeLeft,
    onSwipeRight,
    threshold,
    minRatio,
    disabled
  });

  useEffect(() => {
    configRef.current = {
      onSwipeLeft,
      onSwipeRight,
      threshold,
      minRatio,
      disabled
    };
  }, [onSwipeLeft, onSwipeRight, threshold, minRatio, disabled]);

  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  /**
   * Helper to determine whether swipe navigation must be suppressed.
   * Completely disables swipe when:
   * 1. Any image viewer, lightbox, or annotation canvas is currently open.
   * 2. The touch gesture started on or passed through a drawing canvas, annotation modal, or no-swipe container.
   * 3. The target has touch-action: none.
   */
  const isSwipeSuppressed = (target: HTMLElement | null): boolean => {
    if (typeof document === 'undefined') return false;

    // 1. Check global body flags and active annotation / image modal DOM nodes
    if (
      document.body.getAttribute('data-annotation-open') === 'true' ||
      document.body.getAttribute('data-image-modal-open') === 'true' ||
      document.body.classList.contains('is-annotating') ||
      document.body.classList.contains('is-image-modal-open') ||
      document.querySelector('[data-annotation-active="true"], [data-annotation-modal="true"], [data-image-viewer="true"], [data-lightbox="true"], [data-image-modal="true"]') !== null
    ) {
      return true;
    }

    if (!target) return false;

    // 2. Element or ancestor check for interactive widgets, canvas, or no-swipe areas
    const blockedElement = target.closest(
      'input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), ' +
      'textarea, select, [contenteditable="true"], ' +
      'canvas, [data-no-swipe], [data-carousel], [data-swipe-card], .no-swipe, ' +
      '[data-annotation-active], [data-annotation-modal], [data-image-viewer], [data-lightbox], [data-image-modal], ' +
      '.touch-none, [style*="touch-action: none"], [style*="touch-action:none"]'
    );
    if (blockedElement) return true;

    // 3. Computed style check (touch-action: none indicates custom drawing/pan canvas)
    try {
      const style = window.getComputedStyle(target);
      if (style.touchAction === 'none') return true;
    } catch {
      // ignore
    }

    return false;
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Attach to provided target element or window for global coverage
    const element: EventTarget = targetRef?.current || window;

    const handleTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent;
      if (configRef.current.disabled) return;
      if (touchEvent.touches.length !== 1) return;

      const target = touchEvent.target as HTMLElement | null;
      if (isSwipeSuppressed(target)) {
        touchStartRef.current = null;
        return;
      }

      const touch = touchEvent.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchEnd = (e: Event) => {
      const touchEvent = e as TouchEvent;
      if (configRef.current.disabled) {
        touchStartRef.current = null;
        return;
      }

      if (!touchStartRef.current || touchEvent.changedTouches.length !== 1) return;

      const target = touchEvent.target as HTMLElement | null;
      if (isSwipeSuppressed(target)) {
        touchStartRef.current = null;
        return;
      }

      const touch = touchEvent.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const elapsed = Date.now() - touchStartRef.current.time;
      touchStartRef.current = null;

      const activeThreshold = configRef.current.threshold ?? 40;
      const activeMinRatio = configRef.current.minRatio ?? 1.15;

      // Ignore if user held finger stationary for too long (> 1000ms) or small movements
      if (elapsed > 1000) return;
      if (Math.abs(dx) < activeThreshold) return;
      // Ensure horizontal swipe is dominant over vertical scroll
      if (Math.abs(dx) < Math.abs(dy) * activeMinRatio) return;

      if (target) {
        // If the swipe originated inside a horizontally scrollable container with room to scroll, let it scroll
        const scrollParent = target.closest('.overflow-x-auto, .overflow-x-scroll') as HTMLElement | null;
        if (scrollParent && scrollParent.scrollWidth > scrollParent.clientWidth + 20) {
          return;
        }
      }

      if (dx > 0) {
        configRef.current.onSwipeRight?.();
      } else {
        configRef.current.onSwipeLeft?.();
      }
    };

    const handleTouchCancel = () => {
      touchStartRef.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart as EventListener, { passive: true });
    element.addEventListener('touchend', handleTouchEnd as EventListener, { passive: true });
    element.addEventListener('touchcancel', handleTouchCancel as EventListener, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart as EventListener);
      element.removeEventListener('touchend', handleTouchEnd as EventListener);
      element.removeEventListener('touchcancel', handleTouchCancel as EventListener);
    };
  }, [targetRef]);
}
