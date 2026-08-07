/**
 * Deterministic pseudo-random generator, seeded by a number.
 * Given the same seed it always returns the same value in [0, 1),
 * so trees keep a stable look/position across re-renders.
 */
export function pr(seed: number): number {
  const v = (Math.sin(seed * 127.1 + 311.7) * 43758.5453) % 1;
  return v < 0 ? v + 1 : v;
}
