import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Modal, Button, Toast, ToastContainer } from 'react-bootstrap';

let nextId = 1;

const ToastCtx = createContext(null);
const ConfirmCtx = createContext(null);

const KIND_BG = {
  success: 'success',
  error: 'danger',
  info: 'light',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const push = useCallback(
    (toast) => {
      const id = nextId++;
      const ttl = toast.duration ?? 4000;
      setToasts((t) => [...t, { id, ...toast }]);
      if (ttl > 0) setTimeout(() => remove(id), ttl);
    },
    [remove]
  );

  const api = {
    success: (message, opts) => push({ kind: 'success', message, ...opts }),
    error: (message, opts) => push({ kind: 'error', message, ...opts }),
    info: (message, opts) => push({ kind: 'info', message, ...opts }),
  };

  return (
    <ToastCtx.Provider value={api}>
      {children}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 2000 }}>
        {toasts.map((t) => (
          <Toast
            key={t.id}
            bg={KIND_BG[t.kind] || 'light'}
            onClose={() => remove(t.id)}
            show
          >
            <Toast.Body className={t.kind === 'info' ? '' : 'text-white'}>
              <div className="d-flex justify-content-between gap-3">
                <span>{t.message}</span>
                <button
                  type="button"
                  onClick={() => remove(t.id)}
                  className={`btn-close ${t.kind === 'info' ? '' : 'btn-close-white'}`}
                  aria-label="Close"
                />
              </div>
            </Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

export function ConfirmProvider({ children }) {
  const [config, setConfig] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback((opts) => {
    setConfig(opts || {});
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = (value) => {
    setConfig(null);
    const r = resolverRef.current;
    resolverRef.current = null;
    r?.(value);
  };

  useEffect(() => {
    if (!config) return;
    const onKey = (e) => {
      if (e.key === 'Enter') settle(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [config]);

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Modal show={!!config} onHide={() => settle(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{config?.title || 'Are you sure?'}</Modal.Title>
        </Modal.Header>
        {config?.message && <Modal.Body>{config.message}</Modal.Body>}
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => settle(false)}>
            {config?.cancelLabel || 'Cancel'}
          </Button>
          <Button
            variant={config?.danger ? 'danger' : 'success'}
            onClick={() => settle(true)}
            autoFocus
          >
            {config?.confirmLabel || 'Confirm'}
          </Button>
        </Modal.Footer>
      </Modal>
    </ConfirmCtx.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error('useConfirm must be inside ConfirmProvider');
  return ctx;
}
