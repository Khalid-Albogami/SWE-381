import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Alert, Button, Spinner, Nav, Badge } from 'react-bootstrap';
import {
  stadiums as stadiumsApi,
  slots as slotsApi,
  pitches as pitchesApi,
} from '../../api/endpoints';
import BookingPanel from '../../components/BookingPanel';
import ChatBox from '../../components/ChatBox';
import AddressLine from '../../components/AddressLine';
import Carousel from '../../components/Carousel';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/feedback';
import { formatSAR } from '../../utils/currency';

export default function StadiumDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [stadium, setStadium] = useState(null);
  const [pitches, setPitches] = useState([]);
  const [selectedPitchId, setSelectedPitchId] = useState(null);
  const [dates, setDates] = useState([]);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  const refreshSlots = useCallback(async () => {
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
    pitchesApi
      .list(id)
      .then((data) => {
        setPitches(data);
        if (data.length > 0) setSelectedPitchId(data[0]._id);
      })
      .catch(() => {});
    refreshSlots();
  }, [id, refreshSlots]);

  const visibleSlots = useMemo(
    () => slots.filter((s) => s.pitchId === selectedPitchId),
    [slots, selectedPitchId]
  );
  const selectedPitch = useMemo(
    () => pitches.find((p) => p._id === selectedPitchId) || null,
    [pitches, selectedPitchId]
  );

  const handleSlotClick = (slot) => {
    if (slot.status !== 'available') return;
    const reserveUrl = `/stadiums/${id}/reserve/${slot._id}`;
    if (!user) {
      navigate('/login', { state: { from: { pathname: reserveUrl } } });
      return;
    }
    if (user.role !== 'user') {
      toast.error('Only match organizers can reserve.');
      return;
    }
    navigate(reserveUrl);
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

        {pitches.length === 0 ? (
          <Alert variant="info" className="mb-0">
            This stadium has no pitches set up yet — check back soon.
          </Alert>
        ) : (
          <>
            <h2 className="h5 mb-2">Pitches</h2>
            <Nav variant="pills" activeKey={selectedPitchId || ''} className="mb-3 flex-wrap">
              {pitches.map((p) => (
                <Nav.Item key={p._id}>
                  <Nav.Link
                    eventKey={p._id}
                    onClick={() => setSelectedPitchId(p._id)}
                    className="px-3 py-1"
                  >
                    {p.name}
                    <Badge bg="light" text="dark" className="ms-2 fw-normal">
                      {formatSAR(p.pricePerHour)} / hr
                    </Badge>
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
            {selectedPitch?.description && (
              <p className="text-secondary small mb-3">{selectedPitch.description}</p>
            )}
            {user?.role === 'user' && (
              <p className="text-secondary small mb-3">
                Tap an available time to reserve. Manage your bookings from{' '}
                <Link to="/reservations" className="text-success">My reservations</Link>.
              </p>
            )}
            {!user && (
              <p className="text-secondary small mb-3">
                Tap an available time — we'll guide you through signing in to confirm.
              </p>
            )}
            {dates.length > 0 && (
              <BookingPanel
                dates={dates}
                slots={visibleSlots}
                currentUserId={user?.id}
                onSlotClick={handleSlotClick}
                interactive={!user || user.role === 'user'}
              />
            )}
          </>
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
