import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Card, Row, Col, Button, Alert, Spinner } from 'react-bootstrap';
import {
  stadiums as stadiumsApi,
  slots as slotsApi,
  pitches as pitchesApi,
  reservations as reservationsApi,
} from '../../api/endpoints';
import { photoURL } from '../../api/axios';
import AddressLine from '../../components/AddressLine';
import { useToast } from '../../components/feedback';
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

export default function ConfirmReservation() {
  const { stadiumId, slotId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [stadium, setStadium] = useState(null);
  const [pitches, setPitches] = useState([]);
  const [slot, setSlot] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [s, slotsRes, p] = await Promise.all([
          stadiumsApi.get(stadiumId),
          slotsApi.forStadium(stadiumId),
          pitchesApi.list(stadiumId),
        ]);
        if (cancelled) return;
        setStadium(s);
        setPitches(p);
        const target = slotsRes.slots.find((x) => x._id === slotId);
        if (!target) setError('This slot no longer exists.');
        else if (target.status !== 'available') setError('This slot is no longer available.');
        else setSlot(target);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.error || 'Failed to load');
      }
    })();
    return () => { cancelled = true; };
  }, [stadiumId, slotId]);

  const pitch = slot ? pitches.find((p) => p._id === slot.pitchId) : null;

  const confirm = async () => {
    setBusy(true);
    try {
      await reservationsApi.reserve(slotId);
      toast.success('Reservation confirmed');
      setDone(true);
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Could not reserve');
      setError(e?.response?.data?.error || 'Could not reserve');
    } finally {
      setBusy(false);
    }
  };

  if (error) {
    return (
      <Container className="py-4" style={{ maxWidth: 720 }}>
        <Alert variant="danger">{error}</Alert>
        <Button as={Link} to={`/stadiums/${stadiumId}`} variant="outline-secondary">
          Back to stadium
        </Button>
      </Container>
    );
  }

  if (!stadium || !slot) {
    return (
      <Container className="py-5 text-center text-secondary">
        <Spinner animation="border" size="sm" className="me-2" /> Loading...
      </Container>
    );
  }

  if (done) {
    return (
      <Container className="py-5" style={{ maxWidth: 600 }}>
        <Card className="shadow-sm text-center">
          <Card.Body className="p-5">
            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: 56 }} />
            <h1 className="h3 mt-3 mb-2">Reservation confirmed!</h1>
            <p className="text-secondary mb-1">
              See you at <strong>{stadium.name}</strong>
            </p>
            <p className="text-secondary mb-1">
              {fullDate(slot.date)} · {fmtRange(slot.startTime, slot.endTime)}
            </p>
            <p className="mb-4">
              {pitch && <span className="text-secondary me-2">{pitch.name}</span>}
              <strong className="text-success">{formatSAR(slot.price)}</strong>
            </p>
            <div className="d-flex gap-2 justify-content-center">
              <Button as={Link} to="/reservations" variant="success">
                View my reservations
              </Button>
              <Button as={Link} to="/" variant="outline-secondary">
                Back to browse
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-4" style={{ maxWidth: 720 }}>
      <Link to={`/stadiums/${stadiumId}`} className="text-success small text-decoration-none">
        <i className="bi bi-arrow-left me-1" /> Back to stadium
      </Link>
      <h1 className="h3 mt-1 mb-3">Confirm your reservation</h1>

      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <Row className="g-3 align-items-center">
            <Col sm={4}>
              {stadium.photos?.[0] ? (
                <img
                  src={photoURL(stadium.photos[0])}
                  alt={stadium.name}
                  className="rounded"
                  style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover' }}
                />
              ) : (
                <div
                  className="rounded bg-light d-flex align-items-center justify-content-center text-secondary"
                  style={{ aspectRatio: '1 / 1' }}
                >
                  No photo
                </div>
              )}
            </Col>
            <Col sm={8}>
              <h2 className="h5 mb-1">{stadium.name}</h2>
              <div className="text-secondary small">
                <AddressLine city={stadium.location?.city} address={stadium.location?.address} />
              </div>
              {stadium.description && (
                <p className="small text-body-secondary mt-2 mb-0">{stadium.description}</p>
              )}
            </Col>
          </Row>

          <hr className="my-4" />

          <Row className="g-3">
            {pitch && <Detail icon="bi-grid-3x3" label="Pitch" value={pitch.name} />}
            <Detail icon="bi-calendar3" label="Date" value={fullDate(slot.date)} />
            <Detail icon="bi-clock" label="Time" value={fmtRange(slot.startTime, slot.endTime)} />
            <Detail
              icon="bi-hourglass-split"
              label="Duration"
              value={`${durationHours(slot.startTime, slot.endTime)} hours`}
            />
            <Detail
              icon="bi-cash-coin"
              label="Price"
              value={<strong className="text-success">{formatSAR(slot.price)}</strong>}
            />
            {stadium.ownerId?.name && (
              <Detail icon="bi-person" label="Host" value={stadium.ownerId.name} />
            )}
          </Row>

          <Alert variant="light" className="mt-4 small mb-0">
            <i className="bi bi-info-circle me-1 text-secondary" />
            You can cancel any time from <em>My reservations</em>.
          </Alert>

          <div className="d-flex gap-2 mt-4">
            <Button variant="success" onClick={confirm} disabled={busy} className="flex-grow-1">
              {busy ? 'Confirming...' : (<><i className="bi bi-check2 me-1" /> Confirm reservation</>)}
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => navigate(`/stadiums/${stadiumId}`)}
              disabled={busy}
            >
              Cancel
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
