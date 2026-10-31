import { useEffect, useState } from 'react';
import type { LeaderRow, Period, Profile } from '../../firebase/cloud';
import { loadCloud } from '../../hooks/useCloud';
import Modal from '../Modal/Modal';
import styles from './Leaderboard.module.css';

interface LeaderboardModalProps {
  onClose: () => void;
  uid: string | null;
  profile: Profile | null;
  onSignIn: () => void;
}

interface Board {
  rows: LeaderRow[];
  myRank: number | null;
}

const CACHE_MS = 60_000;
const boardCache = new Map<string, { at: number; board: Board }>();
let communityCache: { at: number; trees: number; people: number } | null = null;

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardModal({ onClose, uid, profile, onSignIn }: LeaderboardModalProps) {
  const [period, setPeriod] = useState<Period>('week');
  const [board, setBoard] = useState<Board | null>(null);
  const [community, setCommunity] = useState(communityCache);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const key = `${period}:${uid ?? ''}`;
    const cached = boardCache.get(key);
    if (cached && Date.now() - cached.at < CACHE_MS) {
      setBoard(cached.board);
      return;
    }
    setBoard(null);
    setError(false);
    loadCloud()
      .then(async (mod) => {
        const rows = await mod.fetchLeaderboard(period);
        let score = 0;
        if (profile) {
          const thisWeek = profile.weekIndex === mod.weekIndexOf(Date.now());
          score = period === 'all' ? profile.total : thisWeek ? profile.weekTotal : 0;
        }
        const myRank = score > 0 ? await mod.fetchRank(period, score) : null;
        const next = { rows, myRank };
        boardCache.set(key, { at: Date.now(), board: next });
        if (!cancelled) setBoard(next);
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, uid]);

  useEffect(() => {
    if (communityCache && Date.now() - communityCache.at < CACHE_MS) return;
    let cancelled = false;
    loadCloud()
      .then((mod) => mod.fetchCommunity())
      .then((c) => {
        communityCache = { at: Date.now(), ...c };
        if (!cancelled) setCommunity(communityCache);
      })
      .catch(() => {
        /* banner just stays hidden */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const inTop = board?.rows.some((r) => r.uid === uid) ?? false;

  return (
    <Modal title="🏆 Leaderboard" onClose={onClose} wide>
      {community && community.trees > 0 && (
        <div className={styles.community}>
          <span className={styles.communityNum}>{community.trees.toLocaleString()}</span>
          <span>
            trees planted together by {community.people.toLocaleString()}{' '}
            {community.people === 1 ? 'person' : 'people'} 🌍
          </span>
        </div>
      )}

      <div className={styles.tabs} role="tablist" aria-label="Leaderboard period">
        {(['week', 'all'] as const).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={period === p}
            className={`${styles.tab} ${period === p ? styles.tabActive : ''}`}
            onClick={() => setPeriod(p)}
          >
            {p === 'week' ? 'This week' : 'All time'}
          </button>
        ))}
      </div>

      {error && (
        <p className={styles.empty}>Couldn't load the leaderboard. Check your connection and try again.</p>
      )}
      {!error && !board && <p className={styles.empty}>Loading…</p>}
      {!error && board && board.rows.length === 0 && (
        <p className={styles.empty}>No trees yet{period === 'week' ? ' this week' : ''}. Be the first to plant! 🌱</p>
      )}

      {board && board.rows.length > 0 && (
        <ol className={styles.list}>
          {board.rows.map((r, i) => (
            <li key={r.uid} className={`${styles.row} ${r.uid === uid ? styles.rowMe : ''}`}>
              <span className={styles.rank}>{MEDALS[i] ?? i + 1}</span>
              <span className={styles.name}>{r.nickname}</span>
              <span className={styles.score}>{r.score.toLocaleString()} 🌳</span>
            </li>
          ))}
        </ol>
      )}

      {board && uid && !inTop && board.myRank && (
        <p className={styles.myRank}>
          Your rank: <b>#{board.myRank.toLocaleString()}</b>
        </p>
      )}

      {!uid && (
        <div className={styles.cta}>
          <p>Sign in to add your trees to the leaderboard.</p>
          <button type="button" className={styles.ctaBtn} onClick={onSignIn}>
            Sign in with Google
          </button>
        </div>
      )}

      <p className={styles.note}>
        The leaderboard counts trees planted while signed in. Totals are checked server-side to keep it fair. Weeks
        reset Monday 00:00 UTC. May Allah accept from all of us. 🤲
      </p>
    </Modal>
  );
}
