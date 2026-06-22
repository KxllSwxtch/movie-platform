'use client';

import { useEffect } from 'react';

const OPEN_OVERLAY_SELECTOR = [
  '[data-state="open"][role="dialog"]',
  '[data-state="open"][role="alertdialog"]',
  '[data-state="open"][role="menu"]',
].join(',');

/** Restore Radix's body lock after the final modal overlay unmounts. */
export function useOverlayBodyCleanup() {
  useEffect(() => () => {
    window.requestAnimationFrame(() => {
      if (!document.querySelector(OPEN_OVERLAY_SELECTOR)) {
        document.body.style.removeProperty('pointer-events');
      }
    });
  }, []);
}
