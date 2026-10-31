import { useState } from 'react';
import type { QadrStatus } from '../../lib/qadr';
import { appNow, formatCountdown } from '../../lib/qadr';
import styles from './Panel.module.css';

interface QadrToggleProps {
  qadrOn: boolean;
  status: QadrStatus;
  onSetOn: (on: boolean) => void;
  onRefresh: (askLocation?: boolean) => Promise<QadrStatus>;
  onActivate: () => Promise<QadrStatus>;
  onToast: (msg: string) => void;
}

function subLabel(status: QadrStatus): string {
  switch (status.kind) {
    case 'active':
      return `Ends at Fajr · ${formatCountdown(status.expiresAt - appNow().getTime())} left`;
    case 'available':
      return 'Available tonight · once per year';
    case 'used':
      return `Used for ${status.hijriYear} AH · returns next Ramadan`;
    case 'daytime':
      return 'Opens at Maghrib tonight';
    case 'closed':
      return 'Last 10 nights of Ramadan · once per year';
  }
}

export default function QadrToggle({ qadrOn, status, onSetOn, onRefresh, onActivate, onToast }: QadrToggleProps) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const locked = status.kind === 'used' || status.kind === 'closed' || status.kind === 'daytime';

  const explain = (s: QadrStatus) => {
    if (s.kind === 'used') onToast(`🌙 Laylatul Qadr mode was used for ${s.hijriYear} AH. It returns next Ramadan.`);
    else if (s.kind === 'daytime') onToast('🌙 Laylatul Qadr mode opens at Maghrib tonight.');
    else if (s.kind === 'closed') onToast('🌙 Laylatul Qadr mode opens in the last 10 nights of Ramadan, once per year.');
  };

  const handleClick = async () => {
    if (status.kind === 'active') {
      onSetOn(!qadrOn);
      return;
    }
    setBusy(true);
    const fresh = await onRefresh();
    setBusy(false);
    if (fresh.kind === 'available') setConfirming(true);
    else if (fresh.kind === 'active') onSetOn(true);
    else explain(fresh);
  };

  const handleActivate = async () => {
    setBusy(true);
    const result = await onActivate();
    setBusy(false);
    setConfirming(false);
    if (result.kind !== 'available') explain(result);
  };

  return (
    <div className={styles.qadrWrap}>
      <button
        type="button"
        role="switch"
        aria-checked={qadrOn}
        aria-describedby="qadr-sub"
        disabled={busy}
        className={[
          styles.qadrToggle,
          qadrOn ? styles.qadrToggleActive : '',
          locked ? styles.qadrToggleLocked : '',
        ].join(' ')}
        onClick={handleClick}
      >
        <span className={styles.togglePill}>
          <span className={styles.toggleKnob} />
        </span>
        <span className={styles.qadrText}>
          <span className={styles.qadrLabel}>
            🌙 Laylatul Qadr {locked && <span aria-hidden="true">🔒</span>}
          </span>
          <span id="qadr-sub" className={styles.qadrSub}>
            {busy ? 'Checking prayer times…' : subLabel(status)}
          </span>
        </span>
        <span className={styles.qadrMult}>×1000</span>
      </button>

      {confirming && (
        <div className={styles.qadrConfirm} role="alertdialog" aria-label="Confirm Laylatul Qadr">
          <p>Use your one Laylatul Qadr night for this year? It lasts until Fajr.</p>
          <div className={styles.qadrConfirmBtns}>
            <button type="button" className={styles.qadrYes} onClick={handleActivate} disabled={busy}>
              Activate
            </button>
            <button type="button" className={styles.qadrNo} onClick={() => setConfirming(false)}>
              Not now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
