import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await register(form);
      navigate(user.role === 'owner' ? '/owner' : '/', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Create account</h1>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {[
          { value: 'user', label: 'Match organizer', sub: 'Find and book pitches' },
          { value: 'owner', label: 'Stadium owner', sub: 'List pitches and slots' },
        ].map((opt) => {
          const active = form.role === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('role')(opt.value)}
              className={`rounded-lg border p-3 text-left text-sm transition ${
                active
                  ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600'
                  : 'border-slate-300 bg-white hover:border-slate-400'
              }`}
            >
              <div className="font-semibold text-slate-900">{opt.label}</div>
              <div className="text-xs text-slate-500">{opt.sub}</div>
            </button>
          );
        })}
      </div>

      <form onSubmit={submit} className="mt-4 space-y-4">
        <Field label="Name" type="text" value={form.name} onChange={set('name')} />
        <Field label="Email" type="email" value={form.email} onChange={set('email')} />
        <Field label="Password" type="password" value={form.password} onChange={set('password')} />
        {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? 'Creating...' : 'Create account'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-emerald-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function Field({ label, type, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus:border-emerald-500 focus:outline-none"
      />
    </label>
  );
}
