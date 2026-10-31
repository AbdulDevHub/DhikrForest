import type { CloudUser } from '../../firebase/cloud';
import styles from './Toolbar.module.css';

export type ToolbarModal = 'leaderboard' | 'settings' | 'account' | 'hadith';

interface ToolbarProps {
  onOpen: (modal: ToolbarModal) => void;
  onShare: () => void;
  user: CloudUser | null;
}

export default function Toolbar({ onOpen, onShare, user }: ToolbarProps) {
  return (
    <nav className={styles.toolbar} aria-label="App menu">
      <button type="button" className={styles.toolBtn} onClick={() => onOpen('leaderboard')}>
        <span className={styles.toolIcon} aria-hidden="true">🏆</span>
        <span className={styles.toolLabel}>Leaders</span>
      </button>
      <button type="button" className={styles.toolBtn} onClick={onShare}>
        <span className={styles.toolIcon} aria-hidden="true">📤</span>
        <span className={styles.toolLabel}>Share</span>
      </button>
      <button type="button" className={styles.toolBtn} onClick={() => onOpen('hadith')}>
        <span className={styles.toolIcon} aria-hidden="true">📖</span>
        <span className={styles.toolLabel}>Hadith</span>
      </button>
      <button type="button" className={styles.toolBtn} onClick={() => onOpen('settings')}>
        <span className={styles.toolIcon} aria-hidden="true">⚙️</span>
        <span className={styles.toolLabel}>Settings</span>
      </button>
      <button type="button" className={styles.toolBtn} onClick={() => onOpen('account')}>
        {user?.photoURL ? (
          <img className={styles.avatar} src={user.photoURL} alt="" referrerPolicy="no-referrer" width={20} height={20} />
        ) : (
          <span className={styles.toolIcon} aria-hidden="true">👤</span>
        )}
        <span className={styles.toolLabel}>{user ? 'Account' : 'Sign in'}</span>
      </button>
    </nav>
  );
}
