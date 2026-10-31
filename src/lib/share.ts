import { SITE_URL } from '../utils/constants';

/** Native share sheet where available, otherwise copy to clipboard. Returns what happened. */
export async function shareForest(totalTrees: number): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
  const text =
    totalTrees > 0
      ? `I've planted ${totalTrees.toLocaleString()} trees in Jannah with DhikrForest 🌳 Plant yours with every dhikr:`
      : 'Plant a tree in Jannah with every dhikr 🌳 A free, offline dhikr counter:';

  if (navigator.share) {
    try {
      await navigator.share({ title: 'DhikrForest', text, url: SITE_URL });
      return 'shared';
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(`${text} ${SITE_URL}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}
