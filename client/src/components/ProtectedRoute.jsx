import { Navigate, useLocation } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5 text-secondary">
        <Spinner animation="border" size="sm" className="me-2" />
        Loading...
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }
  return children;
}
