import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { stadiums as stadiumsApi } from '../../api/endpoints';

export default function AddStadium() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', city: '', address: '' });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      for (const file of files) fd.append('photos', file);
      const created = await stadiumsApi.create(fd);
      navigate(`/owner/stadiums/${created._id}`);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Add a stadium</h1>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <Field label="Name" required value={form.name} onChange={set('name')} />
        <Field label="City" required value={form.city} onChange={set('city')} />
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Address</span>
          <input
            type="text"
            value={form.address}
            onChange={set('address')}
            placeholder="Street address or a Google Maps URL"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
          />
          <span className="mt-1 block text-xs text-slate-500">
            Paste a Google Maps link here and it will show as a clickable map pin.
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Description</span>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={3}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">Photos (up to 8, images only, 10 MB each)</span>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
          />
          {files.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">{files.length} file(s) selected</p>
          )}
        </label>
        {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? 'Saving...' : 'Create stadium'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, required, type = 'text' }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
      />
    </label>
  );
}
