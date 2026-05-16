import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Alert, Button, Spinner } from 'react-bootstrap';
import {
  stadiums as stadiumsApi,
  slots as slotsApi,
  reservations as reservationsApi,
} from '../../api/endpoints';
import BookingPanel from '../../components/BookingPanel';
import ChatBox from '../../components/ChatBox';
import AddressLine from '../../components/AddressLine';
import Carousel from '../../components/Carousel';
import { useAuth } from '../../context/AuthContext';
import { useToast, useConfirm } from '../../components/feedback';

export default function StadiumDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
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
    navigate(`/stadiums/${id}/reserve/${slot._id}`);
  };

  if (error) return <Container className="py-4"><Alert variant="danger">{error}</Alert></Container>;
  if (!stadium) return (
    <Container className="py-5 text-center text-secondary">
      <Spinner animation="border" size="sm" className="me-2" /> Loading...
    </Container>
  );

  const ownerId = stadium.ownerId?._id || stadium.ownerId;
  const canChat = user && user.role === 'user' && ownerId && ownerId !== user.id;

  return (
    <Container className="py-4">
      <Link to="/" className="text-success small text-decoration-none">
        <i className="bi bi-arrow-left me-1" /> Back to stadiums
      </Link>
      <Row className="g-3 mt-1">
        <Col lg={8}>
          <Carousel photos={stadium.photos} alt={stadium.name} />
        </Col>
        <Col lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title className="h4">{stadium.name}</Card.Title>
              <div className="text-secondary small">
                <AddressLine city={stadium.location?.city} address={stadium.location?.address} />
              </div>
              {stadium.description && (
                <Card.Text className="mt-3 small">{stadium.description}</Card.Text>
              )}
              {stadium.ownerId?.name && (
                <div className="text-secondary small mt-2">Owned by {stadium.ownerId.name}</div>
              )}
              {canChat && (
                <Button
                  variant="outline-success"
                  className="w-100 mt-3"
                  onClick={() => setChatOpen((v) => !v)}
                >
                  <i className="bi bi-chat-dots me-1" />
                  {chatOpen ? 'Hide chat' : 'Message owner'}
                </Button>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {canChat && chatOpen && (
        <div className="mt-3">
          <ChatBox
            otherUserId={ownerId}
            otherUserName={stadium.ownerId?.name}
            stadiumId={stadium._id}
            stadiumName={stadium.name}
          />
        </div>
      )}

      <div className="mt-4">
        <SignInBanner user={user} pathname={location.pathname} />
        {user?.role === 'user' && (
          <p className="text-secondary small mb-3">
            Tap a time to reserve. Amber slots are yours — tap to cancel.
          </p>
        )}
        {dates.length > 0 && (
          <BookingPanel
            dates={dates}
            slots={slots}
            currentUserId={user?.id}
            onSlotClick={handleSlotClick}
            interactive={user?.role === 'user'}
          />
        )}
      </div>
    </Container>
  );
}

function SignInBanner({ user, pathname }) {
  if (user?.role === 'user') return null;
  const message = !user
    ? 'Sign in as a match organizer to reserve a slot.'
    : 'You are signed in as a stadium owner — only match organizers can reserve.';
  return (
    <Alert variant="warning" className="d-flex flex-wrap justify-content-between align-items-center gap-2">
      <span>{message}</span>
      {!user && (
        <div className="d-flex gap-2">
          <Button as={Link} to="/login" state={{ from: { pathname } }} variant="success" size="sm">
            Sign in
          </Button>
          <Button as={Link} to="/register" variant="outline-success" size="sm">
            Create account
          </Button>
        </div>
      )}
    </Alert>
  );
}
