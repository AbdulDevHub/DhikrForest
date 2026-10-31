import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Cloud } from '../../hooks/useCloud';
import { nicknameProblem } from '../../hooks/useCloud';
import Modal from '../Modal/Modal';
import styles from './Toolbar.module.css';

interface AccountModalProps {
  cloud: Cloud;
  pendingTrees: number;
  onClose: () => void;
  onToast: (msg: string) => void;
}

function NicknameForm({ initial, submitLabel, onSave }: { initial: string; submitLabel: string; onSave: (n: string) => Promise<void> }) {
  const [name, setName] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const problem = nicknameProblem(name);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(name);
    } catch {
      setError('Could not save. Check your connection and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.nickForm} onSubmit={submit}>
      <label className={styles.sectionHint} htmlFor="nickname">
        Public nickname (shown on the leaderboard)
      </label>
      <div className={styles.row}>
        <input
          id="nickname"
          className={styles.input}
          value={name}
          maxLength={20}
          autoComplete="nickname"
          placeholder="e.g. Abdullah_92"
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className={styles.primaryBtn} disabled={saving}>
          {saving ? 'Saving…' : submitLabel}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}

export default function AccountModal({ cloud, pendingTrees, onClose, onToast }: AccountModalProps) {
  const [busy, setBusy] = useState(false);

  const signIn = async () => {
    setBusy(true);
    try {
      await cloud.signIn();
    } catch {
      onToast('Sign-in failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="👤 Account" onClose={onClose}>
      {cloud.status === 'loading' && <p className={styles.sectionHint}>Connecting…</p>}

      {cloud.status === 'unavailable' && (
        <p className={styles.sectionHint}>
          Online features can't load right now (are you offline?). Your forest is safe on this device.
        </p>
      )}

      {cloud.status === 'signedOut' && (
        <>
          <p className={styles.lead}>Sign in to join the leaderboard and keep your forest safe across devices.</p>
          <ul className={styles.perks}>
            <li>🏆 Appear on the weekly and all-time leaderboards</li>
            <li>☁️ Back up your forest and streak</li>
            <li>🔒 Only a nickname you choose is public. Your name and email stay private.</li>
            <li>📴 Signing in is optional. Everything works offline without it.</li>
          </ul>
          <button type="button" className={styles.googleBtn} onClick={signIn} disabled={busy}>
            <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
              <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
            </svg>
            {busy ? 'Opening Google…' : 'Sign in with Google'}
          </button>
        </>
      )}

      {cloud.status === 'needsNickname' && (
        <>
          <p className={styles.lead}>Welcome! Choose a nickname for the leaderboard.</p>
          <p className={styles.sectionHint}>
            Trees you plant from now on count toward the leaderboard. Your existing forest stays on this device.
          </p>
          <NicknameForm
            initial=""
            submitLabel="Join"
            onSave={async (n) => {
              await cloud.saveNickname(n);
              onToast(`🌳 Welcome to the leaderboard, ${n.trim()}!`);
            }}
          />
          <button type="button" className={styles.linkBtn} onClick={cloud.signOut}>
            Sign out
          </button>
        </>
      )}

      {cloud.status === 'ready' && cloud.profile && (
        <>
          <p className={styles.lead}>
            Signed in as <b className={styles.gold}>{cloud.profile.nickname}</b>
          </p>
          <div className={styles.statsGrid}>
            <div>
              <span className={styles.statNum}>{cloud.profile.total.toLocaleString()}</span>
              <span className={styles.sectionHint}>leaderboard trees</span>
            </div>
            <div>
              <span className={styles.statNum}>{pendingTrees.toLocaleString()}</span>
              <span className={styles.sectionHint}>waiting to sync</span>
            </div>
          </div>
          <NicknameForm
            initial={cloud.profile.nickname}
            submitLabel="Rename"
            onSave={async (n) => {
              await cloud.saveNickname(n);
              onToast('Nickname updated');
            }}
          />
          <p className={styles.sectionHint}>
            Trees sync every few seconds at up to a human pace, so a long offline session may take a little while to
            fully appear on the leaderboard.
          </p>
          <button type="button" className={styles.ghostBtn} onClick={cloud.signOut}>
            Sign out
          </button>
        </>
      )}
    </Modal>
  );
}
