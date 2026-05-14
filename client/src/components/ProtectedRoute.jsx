import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}
