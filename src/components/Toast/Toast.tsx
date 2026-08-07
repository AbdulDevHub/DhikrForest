import styles from './Toast.module.css';

interface ToastProps {
  message: string | null;
}

export default function Toast({ message }: ToastProps) {
  return (
    <div className={`${styles.toast} ${message ? styles.toastVisible : ''}`}>
      {message ?? ''}
    </div>
  );
}
