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
    toastMessage,
    showToast,
    leaves,
    currentPage,
    setCurrentPage,
    totalPages,
    activePageItems,
  } = useForestState();

  const plantButtonRef = useRef<HTMLButtonElement>(null);
  const resetButtonRef = useRef<HTMLButtonElement>(null);

  const handlePlant = () => {
    plant(plantButtonRef.current?.getBoundingClientRect() ?? null);
  };

  const handlePlantRef = useRef(handlePlant);
  handlePlantRef.current = handlePlant;

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
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', border: 0 }}>
        DhikrForest — Plant Trees in Jannah | Visual Dhikr Counter
      </h1>
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
        onToast={showToast}
        plantButtonRef={plantButtonRef}
        resetButtonRef={resetButtonRef}
      />

      <ForestSide
        activePageItems={activePageItems}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        flashKey={flashKey}
      />

      <Toast message={toastMessage} />

      <LeafParticles leaves={leaves} />
    </>
  );
}
