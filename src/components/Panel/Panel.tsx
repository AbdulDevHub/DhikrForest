import type { MouseEvent, RefObject } from 'react';
import type { EffectiveTimeOfDay } from '../../types';
import type { CloudUser } from '../../firebase/cloud';
import type { useQadr } from '../../hooks/useQadr';
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
import Toolbar from '../Toolbar/Toolbar';
import type { ToolbarModal } from '../Toolbar/Toolbar';

interface PanelProps {
  totalTrees: number;
  sessionCount: number;
  todayCount: number;
  goal: number;
  streak: number;
  currentZikr: number;
  onSelectZikr: (index: number) => void;
  qadr: ReturnType<typeof useQadr>;
  onPlant: (e: MouseEvent<HTMLButtonElement>) => void;
  bumpKey: number;
  isGlowing: boolean;
  onToast: (msg: string) => void;
  plantButtonRef: RefObject<HTMLButtonElement | null>;
  effectiveTimeMode: EffectiveTimeOfDay;
  onOpen: (modal: ToolbarModal) => void;
  onShare: () => void;
  user: CloudUser | null;
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
  todayCount,
  goal,
  streak,
  currentZikr,
  onSelectZikr,
  qadr,
  onPlant,
  bumpKey,
  isGlowing,
  onToast,
  plantButtonRef,
  effectiveTimeMode,
  onOpen,
  onShare,
  user,
}: PanelProps) {
  const showSun  = effectiveTimeMode === 'morning' || effectiveTimeMode === 'afternoon';
  const showMoon = effectiveTimeMode === 'night' || effectiveTimeMode === 'qadr';
  const timeCls  = TIME_CLASS[effectiveTimeMode] ? styles[TIME_CLASS[effectiveTimeMode] as keyof typeof styles] : '';

  return (
    <aside
      aria-label="Dhikr counter"
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

      <div className={styles.panelInner}>
        <Counter totalTrees={totalTrees} bumpKey={bumpKey} />

        <div className={styles.divider} />

        <ZikrBlock zikr={ZIKRS[currentZikr]} qadrOn={qadr.qadrOn} />
        <ZikrNav currentZikr={currentZikr} onSelect={onSelectZikr} />

        <PlantButton ref={plantButtonRef} onPlant={onPlant} />

        <StatsRow sessionCount={sessionCount} todayCount={todayCount} goal={goal} streak={streak} />

        <MilestonePane totalTrees={totalTrees} onToast={onToast} />

        <QadrToggle
          qadrOn={qadr.qadrOn}
          status={qadr.status}
          onSetOn={qadr.setQadrOn}
          onRefresh={qadr.refresh}
          onActivate={qadr.activate}
          onToast={onToast}
        />

        <Toolbar onOpen={onOpen} onShare={onShare} user={user} />
      </div>
    </aside>
  );
}
