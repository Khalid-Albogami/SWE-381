import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { slots as slotsApi, stadiums as stadiumsApi } from '../../api/endpoints';
import { photoURL } from '../../api/axios';
import SlotGrid from '../../components/SlotGrid';
import AddressLine from '../../components/AddressLine';
import { useToast, useConfirm } from '../../components/feedback';

function nextHour(hhmm) {
  const [h] = hhmm.split(':');
  return `${String((Number(h) + 1) % 24).padStart(2, '0')}:00`;
}

export default function ManageStadium() {
  const { id } = useParams();
  const toast = useToast();
  const confirm = useConfirm();
  const [stadium, setStadium] = useState(null);
  const [dates, setDates] = useState([]);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const data = await slotsApi.forStadium(id);
      setDates(data.dates);
      setSlots(data.slots);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load');
    }
  }, [id]);

  useEffect(() => {
    stadiumsApi.get(id).then(setStadium).catch(() => {});
    refresh();
  }, [id, refresh]);

  const createSlot = async (date, startTime) => {
    try {
      await slotsApi.create({ stadiumId: id, date, startTime, endTime: nextHour(startTime) });
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Could not add slot');
    }
  };

  const deleteSlot = async (slot) => {
    const ok = await confirm({
      title: 'Delete this slot?',
      message: `${slot.date} at ${slot.startTime}`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await slotsApi.remove(slot._id);
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Could not delete');
    }
  };

  const deletePhoto = async (filename) => {
    const ok = await confirm({
      title: 'Delete this photo?',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      const updated = await stadiumsApi.removePhoto(id, filename);
      setStadium(updated);
      toast.success('Photo deleted');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Delete failed');
    }
  };

  const uploadPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      for (const f of files) fd.append('photos', f);
      const updated = await stadiumsApi.update(id, fd);
      setStadium(updated);
      toast.success(`Uploaded ${files.length} photo${files.length === 1 ? '' : 's'}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <Link to="/owner" className="text-sm text-emerald-700 hover:underline">
            ← Back to stadiums
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            {stadium ? stadium.name : 'Manage stadium'}
          </h1>
          {stadium && (
            <p className="text-sm text-slate-500">
              <AddressLine city={stadium.location?.city} address={stadium.location?.address} />
            </p>
          )}
        </div>
      </div>

      {stadium && (
        <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Photos</h2>
            <label className="cursor-pointer rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100">
              {uploading ? 'Uploading...' : '+ Add photos'}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                disabled={uploading}
                onChange={uploadPhotos}
                className="hidden"
              />
            </label>
          </div>
          <p className="mt-1 text-xs text-slate-500">Up to 8 per upload, 10 MB each.</p>
          {stadium.photos?.length ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {stadium.photos.map((p) => {
                const filename = p.split('/').pop();
                return (
                  <div key={p} className="group relative">
                    <img
                      src={photoURL(p)}
                      alt={stadium.name}
                      className="aspect-square w-full rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => deletePhoto(filename)}
                      title="Delete photo"
                      className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100 hover:bg-rose-600"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-400">No photos yet.</p>
          )}
        </section>
      )}

      <h2 className="mb-2 text-sm font-semibold text-slate-700">Slots</h2>
      <p className="mb-3 text-sm text-slate-600">
        Click an empty cell to add a 1-hour slot. Click a green cell to delete it. Red cells are reserved and locked.
      </p>
      {error && <p className="mb-3 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {dates.length > 0 && (
        <SlotGrid
          dates={dates}
          slots={slots}
          mode="manage"
          onEmptyClick={createSlot}
          onSlotClick={deleteSlot}
        />
      )}
    </div>
  );
}
