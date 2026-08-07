import { useEffect, useRef } from 'react';
import Panel from './components/Panel/Panel';
import ForestSide from './components/Forest/ForestSide';
import Toast from './components/Toast/Toast';
import LeafParticles from './components/Leaves/LeafParticles';
import { useForestState } from './hooks/useForestState';

export default function App() {
  const {
    totalTrees,
    sessionCount,
    treeCount,
    rows,
    currentZikr,
    setCurrentZikr,
    qadrOn,
    toggleQadr,
    plant,
    reset,
    flashKey,
    bumpKey,
    isGlowing,
    scrollKey,
    toastMessage,
    leaves,
  } = useForestState();

  const plantButtonRef = useRef<HTMLButtonElement>(null);
  const resetButtonRef = useRef<HTMLButtonElement>(null);

  const handlePlant = () => {
    plant(plantButtonRef.current?.getBoundingClientRect() ?? null);
  };

  // Keep a ref to the latest handlePlant so the keydown listener (registered
  // once) always calls the current version without needing to re-subscribe.
  const handlePlantRef = useRef(handlePlant);
  handlePlantRef.current = handlePlant;

  // Enter / Space plants a tree from anywhere, except while the reset
  // button is focused — this mirrors the original app's keyboard handling.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement !== resetButtonRef.current) {
        e.preventDefault();
        handlePlantRef.current();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <Panel
        totalTrees={totalTrees}
        sessionCount={sessionCount}
        rows={rows}
        currentZikr={currentZikr}
        onSelectZikr={setCurrentZikr}
        qadrOn={qadrOn}
        onToggleQadr={toggleQadr}
        onPlant={handlePlant}
        onReset={reset}
        bumpKey={bumpKey}
        isGlowing={isGlowing}
        plantButtonRef={plantButtonRef}
        resetButtonRef={resetButtonRef}
      />

      <ForestSide treeCount={treeCount} scrollKey={scrollKey} flashKey={flashKey} />

      <Toast message={toastMessage} />

      <LeafParticles leaves={leaves} />
    </>
  );
}
