import { forwardRef } from 'react';
import styles from './Panel.module.css';

interface ResetButtonProps {
  onReset: () => void;
}

const ResetButton = forwardRef<HTMLButtonElement, ResetButtonProps>(function ResetButton(
  { onReset },
  ref
) {
  const handleClick = () => {
    if (!window.confirm('Reset ALL trees? This cannot be undone.')) return;
    onReset();
  };

  return (
    <button ref={ref} className={styles.resetBtn} onClick={handleClick}>
      Reset all trees
    </button>
  );
});

export default ResetButton;
