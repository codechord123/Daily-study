import { useUI } from '../store/useUI';

export default function Toast() {
  const toast = useUI((s) => s.toast);
  if (!toast) return null;
  return (
    <div className="toast" key={toast.id} role="status">
      {toast.text}
    </div>
  );
}
