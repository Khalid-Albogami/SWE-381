import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, ListGroup, Button, Spinner, Alert, Card, Badge } from 'react-bootstrap';
import { reservations as reservationsApi } from '../../api/endpoints';
import { photoURL } from '../../api/axios';
import { useToast, useConfirm } from '../../components/feedback';
import { formatSAR } from '../../utils/currency';

export default function MyReservations() {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    reservationsApi
      .mine()
      .then(setItems)
      .catch((e) => setError(e?.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const cancel = async (slotId, label) => {
    const ok = await confirm({
      title: 'Cancel reservation?',
      message: label,
      confirmLabel: 'Cancel reservation',
      cancelLabel: 'Keep it',
      danger: true,
    });
    if (!ok) return;
    try {
      await reservationsApi.cancel(slotId);
      toast.success('Reservation cancelled');
      load();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Could not cancel');
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: 900 }}>
      <h1 className="h3 mb-3">My reservations</h1>
      {loading && (
        <div className="text-secondary"><Spinner animation="border" size="sm" className="me-2" />Loading...</div>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
      {!loading && !error && items.length === 0 && (
        <Card body className="text-center text-secondary py-5">
          You haven't reserved any slots yet.{' '}
          <Link to="/" className="text-success">Browse stadiums</Link>.
        </Card>
      )}
      <ListGroup>
        {items.map((r) => {
          const s = r.stadiumId;
          return (
            <ListGroup.Item key={r._id} className="d-flex align-items-center gap-3 p-0">
              <Link
                to={`/reservations/${r._id}`}
                className="d-flex align-items-center gap-3 flex-grow-1 text-decoration-none text-reset p-3"
              >
                <div style={{ width: 96, height: 64, overflow: 'hidden', borderRadius: 6, background: '#e9ecef', flexShrink: 0 }}>
                  {s?.photos?.[0] && (
                    <img
                      src={photoURL(s.photos[0])}
                      alt={s.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  )}
                </div>
                <div className="flex-grow-1">
                  <div className="fw-semibold">{s?.name || 'Stadium'}</div>
                  <div className="text-secondary small">
                    {s?.location?.city}
                    {r.pitchId?.name && <> · {r.pitchId.name}</>}
                  </div>
                  <div className="small mt-1">{r.date} · {r.startTime}–{r.endTime}</div>
                </div>
                <Badge bg="success-subtle" text="success-emphasis" className="fs-6 me-2">
                  {formatSAR(r.price)}
                </Badge>
              </Link>
              <div className="pe-3">
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => cancel(r._id, `${s?.name || 'Stadium'} · ${r.date} at ${r.startTime}`)}
                >
                  Cancel
                </Button>
              </div>
            </ListGroup.Item>
          );
        })}
      </ListGroup>
    </Container>
  );
}
