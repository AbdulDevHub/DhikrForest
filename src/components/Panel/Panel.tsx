import type { RefObject } from 'react';
import { ZIKRS } from '../../data/zikrs';
import styles from './Panel.module.css';
import Stars from './Stars';
import Moon from './Moon';
import Counter from './Counter';
import ZikrBlock from './ZikrBlock';
import ZikrNav from './ZikrNav';
import PlantButton from './PlantButton';
import StatsRow from './StatsRow';
import MilestonePane from './MilestonePane';
import QadrToggle from './QadrToggle';
import HadithPanel from './HadithPanel';
import ResetButton from './ResetButton';

interface PanelProps {
  totalTrees: number;
  sessionCount: number;
  rows: number;
  currentZikr: number;
  onSelectZikr: (index: number) => void;
  qadrOn: boolean;
  onToggleQadr: () => void;
  onPlant: () => void;
  onReset: () => void;
  bumpKey: number;
  isGlowing: boolean;
  onToast?: (msg: string) => void;
  plantButtonRef: RefObject<HTMLButtonElement | null>;
  resetButtonRef: RefObject<HTMLButtonElement | null>;
}

export default function Panel({
  totalTrees,
  sessionCount,
  rows,
  currentZikr,
  onSelectZikr,
  qadrOn,
  onToggleQadr,
  onPlant,
  onReset,
  bumpKey,
  isGlowing,
  onToast,
  plantButtonRef,
  resetButtonRef,
}: PanelProps) {
  return (
    <aside
      aria-label="Dhikr Control Panel"
      className={[
        styles.panel,
        qadrOn ? styles.panelQadrActive : '',
        isGlowing ? styles.panelGlow : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Stars />
      <Moon />

      <Counter totalTrees={totalTrees} bumpKey={bumpKey} />

      <div className={styles.divider} />

      <ZikrBlock zikr={ZIKRS[currentZikr]} qadrOn={qadrOn} />
      <ZikrNav currentZikr={currentZikr} onSelect={onSelectZikr} />

      <PlantButton ref={plantButtonRef} onPlant={onPlant} />

      <StatsRow sessionCount={sessionCount} rows={rows} />

      <MilestonePane totalTrees={totalTrees} onToast={onToast} />

      <QadrToggle qadrOn={qadrOn} onToggle={onToggleQadr} />

      <HadithPanel />
      <ResetButton ref={resetButtonRef} onReset={onReset} />
    </aside>
  );
}
