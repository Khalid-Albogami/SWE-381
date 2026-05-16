import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider, ConfirmProvider } from './components/feedback';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

import OwnerDashboard from './pages/owner/OwnerDashboard';
import AddStadium from './pages/owner/AddStadium';
import ManageStadium from './pages/owner/ManageStadium';
import Statistics from './pages/owner/Statistics';
import OwnerMessages from './pages/owner/OwnerMessages';

import StadiumDetails from './pages/user/StadiumDetails';
import ConfirmReservation from './pages/user/ConfirmReservation';
import ReservationDetails from './pages/user/ReservationDetails';
import MyReservations from './pages/user/MyReservations';
import UserMessages from './pages/user/UserMessages';

function Owner({ children }) {
  return <ProtectedRoute role="owner">{children}</ProtectedRoute>;
}
function User({ children }) {
  return <ProtectedRoute role="user">{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ConfirmProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/stadiums/:id" element={<StadiumDetails />} />
          <Route path="/search" element={<Navigate to="/" replace />} />

          <Route path="/owner" element={<Owner><OwnerDashboard /></Owner>} />
          <Route path="/owner/stadiums/new" element={<Owner><AddStadium /></Owner>} />
          <Route path="/owner/stadiums/:id" element={<Owner><ManageStadium /></Owner>} />
          <Route path="/owner/stats" element={<Owner><Statistics /></Owner>} />
          <Route path="/owner/messages" element={<Owner><OwnerMessages /></Owner>} />

          <Route path="/stadiums/:stadiumId/reserve/:slotId" element={<User><ConfirmReservation /></User>} />
          <Route path="/reservations" element={<User><MyReservations /></User>} />
          <Route path="/reservations/:slotId" element={<User><ReservationDetails /></User>} />
          <Route path="/messages" element={<User><UserMessages /></User>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
        </ConfirmProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
