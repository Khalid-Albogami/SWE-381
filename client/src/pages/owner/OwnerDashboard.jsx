import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { stadiums as stadiumsApi } from '../../api/endpoints';
import { photoURL } from '../../api/axios';
import { useToast, useConfirm } from '../../components/feedback';

export default function OwnerDashboard() {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    stadiumsApi
      .mine()
      .then(setItems)
      .catch((e) => setError(e?.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id, name) => {
    const ok = await confirm({
      title: 'Delete stadium?',
      message: `"${name}" and all of its slots will be permanently deleted.`,
      confirmLabel: 'Delete stadium',
      danger: true,
    });
    if (!ok) return;
    try {
      await stadiumsApi.remove(id);
      setItems((s) => s.filter((x) => x._id !== id));
      toast.success('Stadium deleted');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">My stadiums</h1>
        <Link
          to="/owner/stadiums/new"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          + Add stadium
        </Link>
      </div>

      {loading && <p className="mt-8 text-slate-500">Loading...</p>}
      {error && <p className="mt-8 text-rose-700">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <div className="mt-12 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          You haven't added any stadiums yet.
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <div key={s._id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="aspect-[16/9] bg-slate-200">
              {s.photos?.[0] ? (
                <img src={photoURL(s.photos[0])} alt={s.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">No photo</div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-900">{s.name}</h3>
              <p className="text-sm text-slate-500">{s.location?.city}</p>
              <div className="mt-3 flex gap-2">
                <Link
                  to={`/owner/stadiums/${s._id}`}
                  className="flex-1 rounded-md bg-emerald-50 px-3 py-1.5 text-center text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  Manage stadium
                </Link>
                <button
                  onClick={() => remove(s._id, s.name)}
                  className="rounded-md bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
