import { useState } from 'react';
import type { TimeOfDayMode } from '../../types';
import type { InstallPrompt } from '../../hooks/useInstallPrompt';
import { DAILY_GOALS } from '../../utils/constants';
import Modal from '../Modal/Modal';
import TimeSelector from '../Panel/TimeSelector';
import styles from './Toolbar.module.css';

interface SettingsModalProps {
  onClose: () => void;
  goal: number;
  onGoal: (goal: number) => void;
  timeMode: TimeOfDayMode;
  onTimeMode: (mode: TimeOfDayMode) => void;
  haptics: boolean;
  onHaptics: (on: boolean) => void;
  install: InstallPrompt;
  onReset: () => void;
}

export default function SettingsModal({
  onClose,
  goal,
  onGoal,
  timeMode,
  onTimeMode,
  haptics,
  onHaptics,
  install,
  onReset,
}: SettingsModalProps) {
  const [confirmReset, setConfirmReset] = useState(false);
  const canVibrate = 'vibrate' in navigator;

  return (
    <Modal title="⚙️ Settings" onClose={onClose}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>🎯 Daily goal</h3>
        <p className={styles.sectionHint}>Dhikr to recite each day. Meet it on consecutive days to grow a streak.</p>
        <div className={styles.chips} role="radiogroup" aria-label="Daily goal">
          {DAILY_GOALS.map((g) => (
            <button
              key={g}
              type="button"
              role="radio"
              aria-checked={goal === g}
              className={`${styles.chip} ${goal === g ? styles.chipActive : ''}`}
              onClick={() => onGoal(g)}
            >
              {g.toLocaleString()}
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>🎨 Sky</h3>
        <TimeSelector timeMode={timeMode} onChange={onTimeMode} />
      </section>

      {canVibrate && (
        <section className={styles.section}>
          <label className={styles.switchRow}>
            <span>
              <span className={styles.sectionTitle}>📳 Vibrate on each tap</span>
              <span className={styles.sectionHint}>Count by feel without looking at the screen.</span>
            </span>
            <input type="checkbox" checked={haptics} onChange={(e) => onHaptics(e.target.checked)} />
          </label>
        </section>
      )}

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>📲 Install app</h3>
        {install.installed ? (
          <p className={styles.sectionHint}>Installed. DhikrForest works offline from your home screen.</p>
        ) : install.canInstall ? (
          <>
            <p className={styles.sectionHint}>Add DhikrForest to your home screen. It works fully offline.</p>
            <button type="button" className={styles.primaryBtn} onClick={install.install}>
              Install DhikrForest
            </button>
          </>
        ) : install.isIOS ? (
          <p className={styles.sectionHint}>
            In Safari, tap <b>Share</b> then <b>Add to Home Screen</b>. It works fully offline.
          </p>
        ) : (
          <p className={styles.sectionHint}>
            Use your browser menu's <b>Install app</b> or <b>Add to Home screen</b> option.
          </p>
        )}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>🗑️ Reset forest</h3>
        <p className={styles.sectionHint}>
          Clears the trees on this device. Your Laylatul Qadr night and leaderboard total are not affected.
        </p>
        {confirmReset ? (
          <div className={styles.row}>
            <button
              type="button"
              className={styles.dangerBtn}
              onClick={() => {
                onReset();
                setConfirmReset(false);
                onClose();
              }}
            >
              Yes, reset all trees
            </button>
            <button type="button" className={styles.ghostBtn} onClick={() => setConfirmReset(false)}>
              Cancel
            </button>
          </div>
        ) : (
          <button type="button" className={styles.ghostBtn} onClick={() => setConfirmReset(true)}>
            Reset all trees…
          </button>
        )}
      </section>

      <p className={styles.footer}>
        Free and open source, made as a sadaqah jariyah.{' '}
        <a href="https://github.com/AbdulDevHub/DhikrForest" target="_blank" rel="noopener">
          View on GitHub
        </a>
      </p>
    </Modal>
  );
}
