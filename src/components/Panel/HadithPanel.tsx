import { useEffect, useRef, useState } from 'react';
import styles from './Panel.module.css';

export default function HadithPanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        target !== btnRef.current &&
        !btnRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <>
      <button ref={btnRef} className={styles.hadithToggle} onClick={() => setOpen((o) => !o)}>
        ☪️ About these Zikrs
      </button>

      {open && (
        <div className={styles.hadithBackdrop} onClick={() => setOpen(false)}>
          <div
            ref={panelRef}
            className={`${styles.hadith} ${styles.hadithShow}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.hadithHeader}>
              <span>☪️ Hadith &amp; Virtues of Zikr</span>
              <button className={styles.hadithClose} onClick={() => setOpen(false)}>
                ✕
              </button>
            </div>

            <div className={styles.hadithBody}>
              <strong>"سُبْحَانَ اللَّهِ وَبِحَمْدِهِ" — Subḥānallāhi wa biḥamdihī</strong>
              The Prophet ﷺ said: <em>"Two words light on the tongue, heavy on the Scale, beloved to the Most Merciful."</em>
              {' '}— Ṣaḥīḥ al-Bukhārī &amp; Muslim &nbsp;·&nbsp;
              <strong style={{ display: 'inline', fontSize: '.74rem' }}>Plants 1 tree 🌿</strong>

              <div className={styles.sep} />

              <strong>"سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَٰهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ"</strong>
              The Prophet ﷺ said: <em>"The most beloved words to Allah are four — it does not matter which you begin with."</em>
              {' '}— Ṣaḥīḥ Muslim &nbsp;·&nbsp;
              <strong style={{ display: 'inline', fontSize: '.74rem' }}>Plants 4 trees 🌳🌳🌳🌳</strong>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
