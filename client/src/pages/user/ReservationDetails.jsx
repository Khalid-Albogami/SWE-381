import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Card, Row, Col, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { reservations as reservationsApi } from '../../api/endpoints';
import { photoURL } from '../../api/axios';
import AddressLine from '../../components/AddressLine';
import Carousel from '../../components/Carousel';
import { useToast, useConfirm } from '../../components/feedback';
import { formatSAR } from '../../utils/currency';

function fmtRange(start, end) {
  const to12 = (t) => {
    const [hStr, m] = t.split(':');
    let h = parseInt(hStr, 10);
    const pm = h >= 12;
    if (h === 0) h = 12;
    else if (h > 12) h -= 12;
    return { label: `${h}:${m}`, pm };
  };
  const a = to12(start);
  const b = to12(end);
  if (a.pm === b.pm) return `${a.label}–${b.label} ${a.pm ? 'pm' : 'am'}`;
  return `${a.label} ${a.pm ? 'pm' : 'am'} – ${b.label} ${b.pm ? 'pm' : 'am'}`;
}

function durationHours(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return Math.round((mins / 60) * 10) / 10;
}

function fullDate(d) {
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function ReservationDetails() {
  const { slotId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const confirm = useConfirm();
  const [reservation, setReservation] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    reservationsApi
      .mine()
      .then((list) => {
        if (cancelled) return;
        const r = list.find((x) => x._id === slotId);
        if (!r) setError('Reservation not found.');
        else setReservation(r);
      })
      .catch((e) => !cancelled && setError(e?.response?.data?.error || 'Failed to load'));
    return () => { cancelled = true; };
  }, [slotId]);

  const cancel = async () => {
    const ok = await confirm({
      title: 'Cancel reservation?',
      message: `${reservation.stadiumId?.name} · ${reservation.date} at ${reservation.startTime}`,
      confirmLabel: 'Cancel reservation',
      cancelLabel: 'Keep it',
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await reservationsApi.cancel(slotId);
      toast.success('Reservation cancelled');
      navigate('/reservations', { replace: true });
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Could not cancel');
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <Container className="py-4" style={{ maxWidth: 720 }}>
        <Alert variant="danger">{error}</Alert>
        <Button as={Link} to="/reservations" variant="outline-secondary">
          Back to my reservations
        </Button>
      </Container>
    );
  }

  if (!reservation) {
    return (
      <Container className="py-5 text-center text-secondary">
        <Spinner animation="border" size="sm" className="me-2" /> Loading...
      </Container>
    );
  }

  const stadium = reservation.stadiumId;
  const pitch = reservation.pitchId;

  return (
    <Container className="py-4" style={{ maxWidth: 800 }}>
      <Link to="/reservations" className="text-success small text-decoration-none">
        <i className="bi bi-arrow-left me-1" /> Back to my reservations
      </Link>
      <div className="d-flex justify-content-between align-items-center mt-1 mb-3">
        <h1 className="h3 mb-0">Reservation details</h1>
        <Badge bg="success-subtle" text="success-emphasis" className="fs-6">
          <i className="bi bi-check-circle me-1" /> Confirmed
        </Badge>
      </div>

      <Card className="shadow-sm">
        {stadium?.photos?.length > 0 && (
          <Carousel photos={stadium.photos} alt={stadium?.name} aspect="16x9" rounded="rounded-0" />
        )}
        <Card.Body className="p-4">
          <Row className="g-3 align-items-start">
            <Col md={8}>
              <h2 className="h4 mb-1">
                {stadium?._id ? (
                  <Link to={`/stadiums/${stadium._id}`} className="text-decoration-none text-reset">
                    {stadium?.name}
                  </Link>
                ) : (
                  stadium?.name
                )}
              </h2>
              <div className="text-secondary small">
                <AddressLine city={stadium?.location?.city} address={stadium?.location?.address} />
              </div>
            </Col>
            <Col md={4} className="text-md-end">
              <div className="text-secondary small">Total</div>
              <div className="h3 text-success mb-0">{formatSAR(reservation.price)}</div>
            </Col>
          </Row>

          <hr className="my-4" />

          <Row className="g-3">
            {pitch?.name && <Detail icon="bi-grid-3x3" label="Pitch" value={pitch.name} />}
            <Detail icon="bi-calendar3" label="Date" value={fullDate(reservation.date)} />
            <Detail
              icon="bi-clock"
              label="Time"
              value={fmtRange(reservation.startTime, reservation.endTime)}
            />
            <Detail
              icon="bi-hourglass-split"
              label="Duration"
              value={`${durationHours(reservation.startTime, reservation.endTime)} hours`}
            />
            {reservation.reservedAt && (
              <Detail
                icon="bi-clock-history"
                label="Booked on"
                value={new Date(reservation.reservedAt).toLocaleString()}
              />
            )}
          </Row>

          <div className="d-flex gap-2 mt-4">
            {stadium?._id && (
              <Button as={Link} to={`/stadiums/${stadium._id}`} variant="outline-secondary">
                <i className="bi bi-geo-alt me-1" /> Stadium page
              </Button>
            )}
            <Button
              variant="outline-danger"
              onClick={cancel}
              disabled={busy}
              className="ms-auto"
            >
              <i className="bi bi-x-lg me-1" /> Cancel reservation
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

function Detail({ icon, label, value }) {
  return (
    <Col sm={6}>
      <div className="text-secondary small">
        <i className={`bi ${icon} me-1`} />
        {label}
      </div>
      <div className="fw-medium">{value}</div>
    </Col>
  );
}
