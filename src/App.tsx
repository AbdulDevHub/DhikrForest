import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import Panel from './components/Panel/Panel';
import ForestSide from './components/Forest/ForestSide';
import Toast from './components/Toast/Toast';
import LeafParticles from './components/Leaves/LeafParticles';
import HadithPanel from './components/Panel/HadithPanel';
import SettingsModal from './components/Toolbar/SettingsModal';
import AccountModal from './components/Toolbar/AccountModal';
import LeaderboardModal from './components/Leaderboard/LeaderboardModal';
import type { ToolbarModal } from './components/Toolbar/Toolbar';
import { useForestState } from './hooks/useForestState';
import { useTimeOfDay } from './hooks/useTimeOfDay';
import { useCloud } from './hooks/useCloud';
import { useCloudSync } from './hooks/useCloudSync';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { createPlantGuard } from './lib/plantGuard';
import { shareForest } from './lib/share';

/** Elements that keep their own Enter/Space behaviour instead of planting. */
function isOtherControl(el: Element | null, plantButton: HTMLElement | null): boolean {
  if (!el || el === document.body || el === plantButton) return false;
  return el.matches('button, a, input, select, textarea, [role="switch"], [role="tab"], [contenteditable="true"]');
}

export default function App() {
  const cloud = useCloud();
  const forest = useForestState(cloud.syncUid);
  const {
    state,
    setState,
    totalTrees,
    sessionCount,
    currentZikr,
    setCurrentZikr,
    qadr,
    plant,
    reset,
    flashKey,
    bumpKey,
    isGlowing,
    toastMessage,
    showToast,
    leaves,
    currentPage,
    setCurrentPage,
    totalPages,
    activePageItems,
    todayCount,
    streak,
    goal,
    setGoal,
    haptics,
    setHaptics,
  } = forest;

  useCloudSync(cloud, state, setState, showToast);
  const install = useInstallPrompt();
  const { timeMode, setTimeMode, effectiveTimeMode } = useTimeOfDay(qadr.qadrOn);
  const [modal, setModal] = useState<ToolbarModal | null>(null);

  const plantButtonRef = useRef<HTMLButtonElement>(null);
  const [guard] = useState(createPlantGuard);

  const doPlant = () => plant(plantButtonRef.current?.getBoundingClientRect() ?? null);
  const doPlantRef = useRef(doPlant);
  doPlantRef.current = doPlant;

  const handlePlantClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (guard.pointer(e.nativeEvent)) doPlant();
  };

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      if (document.querySelector('[role="dialog"]')) return;
      if (isOtherControl(document.activeElement, plantButtonRef.current)) return;
      e.preventDefault();
      if (guard.keyDown(e)) doPlantRef.current();
    }
    const onKeyUp = (e: KeyboardEvent) => {
      guard.keyUp(e);
      // Firefox/Safari activate a focused button on Space keyup; that would be a second plant.
      if (e.key === ' ' && document.activeElement === plantButtonRef.current) e.preventDefault();
    };
    const onBlur = () => guard.reset();
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [guard]);

  const handleShare = useCallback(async () => {
    const result = await shareForest(totalTrees);
    if (result === 'copied') showToast('🔗 Link copied. Share it and earn the reward of every dhikr it inspires!');
    else if (result === 'failed') showToast('Could not share. Copy the address bar link instead.');
  }, [totalTrees, showToast]);

  const closeModal = useCallback(() => setModal(null), []);
  const pendingTrees = cloud.user ? (state.pending[cloud.user.uid] ?? 0) : 0;

  return (
    <>
      <h1 className="visually-hidden">DhikrForest: a free dhikr counter that plants trees in Jannah</h1>
      <Panel
        totalTrees={totalTrees}
        sessionCount={sessionCount}
        todayCount={todayCount}
        goal={goal}
        streak={streak}
        currentZikr={currentZikr}
        onSelectZikr={setCurrentZikr}
        qadr={qadr}
        onPlant={handlePlantClick}
        bumpKey={bumpKey}
        isGlowing={isGlowing}
        onToast={showToast}
        plantButtonRef={plantButtonRef}
        effectiveTimeMode={effectiveTimeMode}
        onOpen={setModal}
        onShare={handleShare}
        user={cloud.user}
      />

      <ForestSide
        activePageItems={activePageItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        flashKey={flashKey}
        effectiveTimeMode={effectiveTimeMode}
      />

      {modal === 'hadith' && <HadithPanel onClose={closeModal} />}
      {modal === 'settings' && (
        <SettingsModal
          onClose={closeModal}
          goal={goal}
          onGoal={setGoal}
          timeMode={timeMode}
          onTimeMode={setTimeMode}
          haptics={haptics}
          onHaptics={setHaptics}
          install={install}
          onReset={reset}
        />
      )}
      {modal === 'account' && (
        <AccountModal cloud={cloud} pendingTrees={pendingTrees} onClose={closeModal} onToast={showToast} />
      )}
      {modal === 'leaderboard' && (
        <LeaderboardModal
          onClose={closeModal}
          uid={cloud.syncUid}
          profile={cloud.profile}
          onSignIn={() => setModal('account')}
        />
      )}

      <Toast message={toastMessage} />

      <LeafParticles leaves={leaves} />
    </>
  );
}
