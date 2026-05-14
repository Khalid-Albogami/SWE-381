import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkBase = 'px-3 py-1.5 rounded-md text-sm font-medium transition';
const linkInactive = 'text-slate-600 hover:bg-slate-100';
const linkActive = 'bg-emerald-100 text-emerald-700';

function navLinkClass({ isActive }) {
  return `${linkBase} ${isActive ? linkActive : linkInactive}`;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-semibold text-emerald-700">
          ⚽ Golato
        </Link>
        <div className="flex items-center gap-1">
          {!user && (
            <>
              <NavLink to="/login" className={navLinkClass}>Sign in</NavLink>
              <NavLink to="/register" className={navLinkClass}>Sign up</NavLink>
            </>
          )}
          {user?.role === 'owner' && (
            <>
              <NavLink to="/owner" className={navLinkClass} end>My stadiums</NavLink>
              <NavLink to="/owner/stadiums/new" className={navLinkClass}>Add stadium</NavLink>
              <NavLink to="/owner/stats" className={navLinkClass}>Statistics</NavLink>
              <NavLink to="/owner/messages" className={navLinkClass}>Messages</NavLink>
            </>
          )}
          {user?.role === 'user' && (
            <>
              <NavLink to="/" className={navLinkClass} end>Browse</NavLink>
              <NavLink to="/reservations" className={navLinkClass}>My reservations</NavLink>
              <NavLink to="/messages" className={navLinkClass}>Messages</NavLink>
            </>
          )}
          {user && (
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="ml-2 rounded-md bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Sign out ({user.name})
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
