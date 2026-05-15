import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import {
  stadiums as stadiumsApi,
  slots as slotsApi,
  reservations as reservationsApi,
} from '../../api/endpoints';
import SlotGrid from '../../components/SlotGrid';
import ChatBox from '../../components/ChatBox';
import AddressLine from '../../components/AddressLine';
import Carousel from '../../components/Carousel';
import { useAuth } from '../../context/AuthContext';
import { useToast, useConfirm } from '../../components/feedback';

export default function StadiumDetails() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const [stadium, setStadium] = useState(null);
  const [dates, setDates] = useState([]);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const data = await slotsApi.forStadium(id);
      setDates(data.dates);
      setSlots(data.slots);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load slots');
    }
  }, [id]);

  useEffect(() => {
    stadiumsApi.get(id).then(setStadium).catch((e) => setError(e?.response?.data?.error || 'Not found'));
    refresh();
  }, [id, refresh]);

  const handleSlotClick = async (slot) => {
    if (!user || user.role !== 'user') {
      toast.error('Sign in as a match organizer to reserve.');
      return;
    }
    const mine = slot.reservedBy === user.id;
    if (mine) {
      const ok = await confirm({
        title: 'Cancel reservation?',
        message: `Your booking for ${slot.date} at ${slot.startTime} will be released.`,
        confirmLabel: 'Cancel reservation',
        cancelLabel: 'Keep it',
        danger: true,
      });
      if (!ok) return;
      try {
        await reservationsApi.cancel(slot._id);
        toast.success('Reservation cancelled');
        refresh();
      } catch (e) {
        toast.error(e?.response?.data?.error || 'Could not cancel');
      }
      return;
    }
    if (slot.status !== 'available') return;
    const ok = await confirm({
      title: 'Reserve this slot?',
      message: `${slot.date} at ${slot.startTime}–${slot.endTime}`,
      confirmLabel: 'Reserve',
    });
    if (!ok) return;
    try {
      await reservationsApi.reserve(slot._id);
      toast.success('Slot reserved');
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Could not reserve');
    }
  };

  if (error) return <div className="mx-auto max-w-4xl px-4 py-8 text-rose-700">{error}</div>;
  if (!stadium) return <div className="mx-auto max-w-4xl px-4 py-8 text-slate-500">Loading...</div>;

  const ownerId = stadium.ownerId?._id || stadium.ownerId;
  const canChat = user && user.role === 'user' && ownerId && ownerId !== user.id;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/" className="text-sm text-emerald-700 hover:underline">← Back to stadiums</Link>
      <div className="mt-3 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <Carousel photos={stadium.photos} alt={stadium.name} />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">{stadium.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            <AddressLine city={stadium.location?.city} address={stadium.location?.address} />
          </p>
          {stadium.description && (
            <p className="mt-3 text-sm text-slate-700">{stadium.description}</p>
          )}
          {stadium.ownerId?.name && (
            <p className="mt-3 text-xs text-slate-500">Owned by {stadium.ownerId.name}</p>
          )}
          {canChat && (
            <button
              onClick={() => setChatOpen((v) => !v)}
              className="mt-4 w-full rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
            >
              {chatOpen ? 'Hide chat' : 'Message owner'}
            </button>
          )}
        </div>
      </div>

      {canChat && chatOpen && (
        <div className="mt-6">
          <ChatBox
            otherUserId={ownerId}
            otherUserName={stadium.ownerId?.name}
            stadiumId={stadium._id}
            stadiumName={stadium.name}
          />
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Availability — next 7 days</h2>
      <SignInBanner user={user} pathname={location.pathname} />
      {user?.role === 'user' && (
        <p className="mb-3 text-sm text-slate-600">
          Click a green slot to reserve. Yellow shows your own reservations — click to cancel.
        </p>
      )}
      {dates.length > 0 && (
        <SlotGrid
          dates={dates}
          slots={slots}
          mode={user?.role === 'user' ? 'reserve' : 'view'}
          currentUserId={user?.id}
          onSlotClick={handleSlotClick}
        />
      )}
    </div>
  );
}

function SignInBanner({ user, pathname }) {
  if (user?.role === 'user') return null;
  const message = !user
    ? 'Sign in as a match organizer to reserve a slot.'
    : 'You are signed in as a stadium owner — only match organizers can reserve.';
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <span>{message}</span>
      {!user && (
        <div className="flex gap-2">
          <Link
            to="/login"
            state={{ from: { pathname } }}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-md border border-emerald-600 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Create account
          </Link>
        </div>
      )}
    </div>
  );
}
