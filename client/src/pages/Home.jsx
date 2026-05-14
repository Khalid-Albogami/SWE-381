import { useEffect, useState } from 'react';
import { stadiums as stadiumsApi } from '../api/endpoints';
import StadiumCard from '../components/StadiumCard';

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function next7DaysOptions() {
  const out = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    out.push(x.toISOString().slice(0, 10));
  }
  return out;
}

export default function Home() {
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetch = (params = {}) => {
    setLoading(true);
    setError('');
    stadiumsApi
      .list(params)
      .then(setItems)
      .catch((e) => setError(e?.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const submit = (e) => {
    e.preventDefault();
    const params = {};
    if (city.trim()) params.city = city.trim();
    if (date) params.date = date;
    if (startTime) params.startTime = startTime;
    fetch(params);
  };

  const reset = () => {
    setCity(''); setDate(''); setStartTime('');
    fetch();
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 text-white shadow-sm">
        <h1 className="text-3xl font-bold sm:text-4xl">Find and book a soccer pitch.</h1>
        <p className="mt-2 max-w-2xl text-emerald-50">
          Browse stadiums, pick a free time slot from the 7-day grid, and reserve in seconds.
        </p>
      </div>

      <form
        onSubmit={submit}
        className="mt-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[2fr_1fr_1fr_auto_auto]"
      >
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City (e.g., Riyadh)"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        />
        <select
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Any date</option>
          {next7DaysOptions().map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
        >
          <option value="">Any time</option>
          {HOURS.map((h) => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          Search
        </button>
        {(city || date || startTime) && (
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Reset
          </button>
        )}
      </form>

      {loading && <p className="mt-8 text-slate-500">Loading...</p>}
      {error && <p className="mt-8 text-rose-700">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <div className="mt-12 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No stadiums match your search.
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <StadiumCard key={s._id} stadium={s} to={`/stadiums/${s._id}`} />
        ))}
      </div>
    </div>
  );
}
