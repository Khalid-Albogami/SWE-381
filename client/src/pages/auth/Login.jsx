import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      const from = location.state?.from?.pathname;
      navigate(from || (user.role === 'owner' ? '/owner' : '/'), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mt-16 max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={password} onChange={setPassword} />
        {error && <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-emerald-600 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        New here?{' '}
        <Link to="/register" className="font-medium text-emerald-700 hover:underline">
          Create an account
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
