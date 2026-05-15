import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

let nextId = 1;

const ToastCtx = createContext(null);
const ConfirmCtx = createContext(null);

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
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-lg border px-4 py-3 text-sm shadow-md ${
              t.kind === 'success'
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : t.kind === 'error'
                ? 'border-rose-300 bg-rose-50 text-rose-900'
                : 'border-slate-300 bg-white text-slate-900'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <span>{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                className="-mr-1 -mt-1 text-slate-400 hover:text-slate-700"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
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
      if (e.key === 'Escape') settle(false);
      if (e.key === 'Enter') settle(true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [config]);

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      {config && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => settle(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900">
              {config.title || 'Are you sure?'}
            </h3>
            {config.message && (
              <p className="mt-2 text-sm text-slate-600">{config.message}</p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => settle(false)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {config.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => settle(true)}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
                  config.danger
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {config.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmCtx.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmCtx);
  if (!ctx) throw new Error('useConfirm must be inside ConfirmProvider');
  return ctx;
}
