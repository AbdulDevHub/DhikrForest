import { useEffect, useRef, useState } from 'react';
import { MILESTONE_THRESHOLDS, MILESTONES } from '../../data/zikrs';
import styles from './Panel.module.css';

interface MilestonePaneProps {
  totalTrees: number;
  onToast?: (msg: string) => void;
}

export default function MilestonePane({ totalTrees, onToast }: MilestonePaneProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Find next target milestone
  const nextTarget = MILESTONE_THRESHOLDS.find((m) => m > totalTrees) ?? MILESTONE_THRESHOLDS[MILESTONE_THRESHOLDS.length - 1];
  const allAchieved = totalTrees >= MILESTONE_THRESHOLDS[MILESTONE_THRESHOLDS.length - 1];

  // Previous milestone threshold for proportional bar filling
  const prevTargetIdx = MILESTONE_THRESHOLDS.findIndex((m) => m > totalTrees) - 1;
  const prevTarget = prevTargetIdx >= 0 ? MILESTONE_THRESHOLDS[prevTargetIdx] : 0;

  // Calculate percentage
  let progressPercent = 100;
  if (!allAchieved) {
    const range = nextTarget - prevTarget;
    const currentInRange = totalTrees - prevTarget;
    progressPercent = Math.min(100, Math.max(0, (currentInRange / range) * 100));
  }

  const remaining = Math.max(0, nextTarget - totalTrees);
  const nextQuote = MILESTONES[nextTarget] || '';

  // Close modal on click outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        modalRef.current &&
        !modalRef.current.contains(target) &&
        btnRef.current &&
        !btnRef.current.contains(target)
      ) {
        setModalOpen(false);
      }
    }
    if (modalOpen) {
      document.addEventListener('click', onDocClick);
    }
    return () => document.removeEventListener('click', onDocClick);
  }, [modalOpen]);

  const handleMilestoneClick = (threshold: number) => {
    if (onToast && MILESTONES[threshold]) {
      onToast(MILESTONES[threshold]);
    }
  };

  return (
    <div className={styles.milestonePane}>
      {/* Live Target Card */}
      <div className={styles.milestoneCard}>
        <div className={styles.milestoneCardHeader}>
          <span className={styles.milestoneCardTitle}>
            {allAchieved ? '👑 All Goals Reached!' : `🎯 Next Goal: ${nextTarget.toLocaleString()} Trees`}
          </span>
          <button
            ref={btnRef}
            className={styles.viewGoalsBtn}
            onClick={() => setModalOpen((o) => !o)}
            title="View all 17 Dhikr goals"
          >
            All Goals 🎯
          </button>
        </div>

        {/* Progress Bar */}
        <div className={styles.progressBarBg}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Progress Numbers */}
        <div className={styles.milestoneMeta}>
          <span>{totalTrees.toLocaleString()} / {nextTarget.toLocaleString()}</span>
          <span>{allAchieved ? '100%' : `${remaining.toLocaleString()} left`}</span>
        </div>

        {/* Target Motivation Text */}
        {!allAchieved && (
          <div className={styles.milestoneQuote}>
            {nextQuote}
          </div>
        )}
      </div>

      {/* All Milestones Modal */}
      {modalOpen && (
        <div className={styles.hadithBackdrop} onClick={() => setModalOpen(false)}>
          <div
            ref={modalRef}
            className={`${styles.hadith} ${styles.hadithShow}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.hadithHeader}>
              <span>🎯 Dhikr Milestones &amp; Aspiring Goals</span>
              <button className={styles.hadithClose} onClick={() => setModalOpen(false)}>
                ✕
              </button>
            </div>

            <div className={styles.milestoneList}>
              {MILESTONE_THRESHOLDS.map((threshold) => {
                const isAchieved = totalTrees >= threshold;
                const isActive = !allAchieved && threshold === nextTarget;
                const text = MILESTONES[threshold];

                let badgeText = '🔒 Locked';
                let badgeClass = styles.badgeLocked;

                if (isAchieved) {
                  badgeText = '✅ Achieved';
                  badgeClass = styles.badgeAchieved;
                } else if (isActive) {
                  badgeText = '🎯 Active Goal';
                  badgeClass = styles.badgeActive;
                }

                return (
                  <div
                    key={threshold}
                    className={[
                      styles.milestoneItem,
                      isAchieved ? styles.milestoneItemAchieved : '',
                      isActive ? styles.milestoneItemActive : '',
                    ].join(' ')}
                    onClick={() => handleMilestoneClick(threshold)}
                    title={isAchieved ? 'Click to preview celebration toast' : ''}
                  >
                    <div className={styles.milestoneItemHeader}>
                      <span className={styles.milestoneCount}>
                        {threshold.toLocaleString()} Trees
                      </span>
                      <span className={`${styles.milestoneBadge} ${badgeClass}`}>
                        {badgeText}
                      </span>
                    </div>

                    <div className={styles.milestoneItemText}>{text}</div>

                    {isActive && (
                      <div className={styles.itemProgressContainer}>
                        <div className={styles.progressBarBg}>
                          <div
                            className={styles.progressBarFill}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className={styles.itemProgressMeta}>
                          <span>{totalTrees.toLocaleString()} / {threshold.toLocaleString()}</span>
                          <span>{remaining.toLocaleString()} trees needed</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
