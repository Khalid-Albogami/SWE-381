import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { reservations as reservationsApi } from '../../api/endpoints';
import { photoURL } from '../../api/axios';
import { useToast, useConfirm } from '../../components/feedback';

export default function MyReservations() {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    reservationsApi
      .mine()
      .then(setItems)
      .catch((e) => setError(e?.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const cancel = async (slotId, label) => {
    const ok = await confirm({
      title: 'Cancel reservation?',
      message: label,
      confirmLabel: 'Cancel reservation',
      cancelLabel: 'Keep it',
      danger: true,
    });
    if (!ok) return;
    try {
      await reservationsApi.cancel(slotId);
      toast.success('Reservation cancelled');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Could not cancel');
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">My reservations</h1>
      {loading && <p className="mt-6 text-slate-500">Loading...</p>}
      {error && <p className="mt-6 text-rose-700">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <div className="mt-10 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          You haven't reserved any slots yet.{' '}
          <Link to="/" className="text-emerald-700 hover:underline">Browse stadiums</Link>.
        </div>
      )}
      <ul className="mt-6 space-y-3">
        {items.map((r) => {
          const s = r.stadiumId;
          return (
            <li
              key={r._id}
              className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-md bg-slate-200">
                {s?.photos?.[0] ? (
                  <img src={photoURL(s.photos[0])} alt={s.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <Link to={`/stadiums/${s?._id}`} className="font-semibold text-slate-900 hover:underline">
                  {s?.name || 'Stadium'}
                </Link>
                <p className="text-sm text-slate-500">{s?.location?.city}</p>
                <p className="mt-1 text-sm text-slate-700">
                  {r.date} · {r.startTime}–{r.endTime}
                </p>
              </div>
              <button
                onClick={() => cancel(r._id, `${s?.name || 'Stadium'} · ${r.date} at ${r.startTime}`)}
                className="rounded-md bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
              >
                Cancel
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
