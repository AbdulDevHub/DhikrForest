import { useRef } from 'react';
import styles from './Toast.module.css';

interface ToastProps {
  message: string | null;
}

export default function Toast({ message }: ToastProps) {
  // Keep showing the last text while the toast fades out.
  const lastMessage = useRef('');
  if (message) lastMessage.current = message;

  return (
    <div className={`${styles.toast} ${message ? styles.toastVisible : ''}`} role="status" aria-live="polite">
      {message ?? lastMessage.current}
    </div>
  );
}
