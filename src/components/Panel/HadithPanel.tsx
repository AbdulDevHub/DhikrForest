import Modal from '../Modal/Modal';
import styles from './Panel.module.css';

interface HadithPanelProps {
  onClose: () => void;
}

export default function HadithPanel({ onClose }: HadithPanelProps) {
  return (
    <Modal title="☪️ Hadith & Virtues of Dhikr" onClose={onClose}>
      <div className={styles.hadithBody}>
        <strong lang="ar">"سُبْحَانَ اللَّهِ وَبِحَمْدِهِ" · Subḥānallāhi wa biḥamdihī</strong>
        The Prophet ﷺ said: <em>"Two words light on the tongue, heavy on the Scale, beloved to the Most Merciful:
        Subḥānallāhi wa biḥamdihī, Subḥānallāhil-ʿAẓīm."</em>
        {' '}· Ṣaḥīḥ al-Bukhārī 6406 &amp; Muslim 2694
        <br />
        <em>"Whoever says Subḥānallāhil-ʿAẓīm wa biḥamdihī, a palm tree is planted for him in Paradise."</em>
        {' '}· Jāmiʿ at-Tirmidhī 3464 · <b className={styles.hadithTag}>Plants 1 tree 🌿</b>

        <div className={styles.sep} />

        <strong lang="ar">"سُبْحَانَ اللَّهِ وَالْحَمْدُ لِلَّهِ وَلَا إِلَٰهَ إِلَّا اللَّهُ وَاللَّهُ أَكْبَرُ"</strong>
        The Prophet ﷺ passed by Abū Hurayrah while he was planting and said: <em>"Shall I not guide you to plants better than this? Say: SubḥānAllāh, wal-ḥamdu lillāh, wa lā ilāha illallāh, wallāhu akbar. For each one, a tree will be planted for you in Paradise."</em>
        {' '}· Sunan Ibn Mājah 3807
        <br />
        <em>"The most beloved words to Allah are four, and it does not matter which you begin with."</em>
        {' '}· Ṣaḥīḥ Muslim 2137 · <b className={styles.hadithTag}>Plants 4 trees 🌳🌳🌳🌳</b>

        <div className={styles.sep} />

        <strong>🌙 Laylatul Qadr</strong>
        <em>"The Night of Decree is better than a thousand months."</em> · Al-Qadr 97:3. The ×1000 mode opens in the
        last ten nights of Ramadan, once per year, until Fajr.

        <div className={styles.sep} />

        <p className={styles.hadithNote}>
          This app is a gentle aid for the heart, not a replacement for sincerity and presence in worship. The count
          is a reminder; only Allah knows and rewards what is accepted.
        </p>
      </div>
    </Modal>
  );
}
