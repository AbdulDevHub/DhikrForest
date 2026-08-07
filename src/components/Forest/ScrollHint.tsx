import styles from './Forest.module.css';

interface ScrollHintProps {
  visible: boolean;
}

export default function ScrollHint({ visible }: ScrollHintProps) {
  return (
    <div className={`${styles.scrollHint} ${visible ? styles.scrollHintVisible : ''}`}>
      ↓ Scroll to see older trees
    </div>
  );
}
