import { PLANT_MIN_GAP_MS } from '../utils/constants';

/**
 * Decides whether an input is allowed to plant a tree.
 *
 * - Holding Enter/Space plants once: auto-repeat keydowns are ignored and the
 *   key has to be released before it counts again.
 * - Events created by scripts (`button.click()`, `dispatchEvent`) are ignored,
 *   because the browser marks them `isTrusted: false`.
 * - Plants closer together than PLANT_MIN_GAP_MS are dropped, which caps
 *   auto-clickers at a human pace.
 */
export function createPlantGuard(minGapMs = PLANT_MIN_GAP_MS) {
  let lastPlant = -Infinity;
  const heldKeys = new Set<string>();

  function allowNow(): boolean {
    const now = performance.now();
    if (now - lastPlant < minGapMs) return false;
    lastPlant = now;
    return true;
  }

  return {
    keyDown(e: KeyboardEvent): boolean {
      if (!e.isTrusted || e.repeat || heldKeys.has(e.code)) return false;
      heldKeys.add(e.code);
      return allowNow();
    },
    keyUp(e: KeyboardEvent) {
      heldKeys.delete(e.code);
    },
    /** Window lost focus: keyups may never arrive, so forget held keys. */
    reset() {
      heldKeys.clear();
    },
    pointer(e: { isTrusted: boolean }): boolean {
      if (!e.isTrusted) return false;
      return allowNow();
    },
  };
}

export type PlantGuard = ReturnType<typeof createPlantGuard>;
