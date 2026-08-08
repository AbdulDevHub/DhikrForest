import type { RefObject } from 'react';
import type { EffectiveTimeOfDay, TimeOfDayMode } from '../../types';
import { ZIKRS } from '../../data/zikrs';
import styles from './Panel.module.css';
import Stars from './Stars';
import Moon from './Moon';
import Sun from './Sun';
import Counter from './Counter';
import ZikrBlock from './ZikrBlock';
import ZikrNav from './ZikrNav';
import PlantButton from './PlantButton';
import StatsRow from './StatsRow';
import MilestonePane from './MilestonePane';
import QadrToggle from './QadrToggle';
import HadithPanel from './HadithPanel';
import ResetButton from './ResetButton';
import TimeSelector from './TimeSelector';

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
  effectiveTimeMode: EffectiveTimeOfDay;
  timeMode: TimeOfDayMode;
  onTimeMode: (mode: TimeOfDayMode) => void;
}

const TIME_CLASS: Record<EffectiveTimeOfDay, string> = {
  morning:   'panelMorning',
  afternoon: 'panelAfternoon',
  night:     '',
  qadr:      'panelQadrActive',
};

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
  effectiveTimeMode,
  timeMode,
  onTimeMode,
}: PanelProps) {
  const showSun  = effectiveTimeMode === 'morning' || effectiveTimeMode === 'afternoon';
  const showMoon = effectiveTimeMode === 'night' || effectiveTimeMode === 'qadr';
  const timeCls  = TIME_CLASS[effectiveTimeMode] ? styles[TIME_CLASS[effectiveTimeMode] as keyof typeof styles] : '';

  return (
    <aside
      aria-label="Dhikr Control Panel"
      className={[
        styles.panel,
        timeCls,
        isGlowing ? styles.panelGlow : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showMoon && <Stars />}
      {showMoon && <Moon />}
      {showSun  && <Sun mode={effectiveTimeMode} />}

      <Counter totalTrees={totalTrees} bumpKey={bumpKey} />

      <div className={styles.divider} />

      <ZikrBlock zikr={ZIKRS[currentZikr]} qadrOn={qadrOn} />
      <ZikrNav currentZikr={currentZikr} onSelect={onSelectZikr} />

      <PlantButton ref={plantButtonRef} onPlant={onPlant} />

      <StatsRow sessionCount={sessionCount} rows={rows} />

      <MilestonePane totalTrees={totalTrees} onToast={onToast} />

      <QadrToggle qadrOn={qadrOn} onToggle={onToggleQadr} />

      <TimeSelector timeMode={timeMode} onChange={onTimeMode} />

      <HadithPanel />
      <ResetButton ref={resetButtonRef} onReset={onReset} />
    </aside>
  );
}
