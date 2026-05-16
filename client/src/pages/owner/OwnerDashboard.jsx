import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { stadiums as stadiumsApi } from '../../api/endpoints';
import { photoURL } from '../../api/axios';
import { useToast, useConfirm } from '../../components/feedback';

export default function OwnerDashboard() {
  const toast = useToast();
  const confirm = useConfirm();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    stadiumsApi
      .mine()
      .then(setItems)
      .catch((e) => setError(e?.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  const remove = async (id, name) => {
    const ok = await confirm({
      title: 'Delete stadium?',
      message: `"${name}" and all of its slots will be permanently deleted.`,
      confirmLabel: 'Delete stadium',
      danger: true,
    });
    if (!ok) return;
    try {
      await stadiumsApi.remove(id);
      setItems((s) => s.filter((x) => x._id !== id));
      toast.success('Stadium deleted');
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">My stadiums</h1>
        <Button as={Link} to="/owner/stadiums/new" variant="success">
          <i className="bi bi-plus-lg me-1" /> Add stadium
        </Button>
      </div>

      {loading && (
        <div className="text-center py-5 text-secondary">
          <Spinner animation="border" size="sm" className="me-2" /> Loading...
        </div>
      )}
      {error && <Alert variant="danger">{error}</Alert>}
      {!loading && !error && items.length === 0 && (
        <Card body className="text-center text-secondary py-5">
          You haven't added any stadiums yet.
        </Card>
      )}

      <Row className="g-3">
        {items.map((s) => (
          <Col key={s._id} sm={6} lg={4}>
            <Card className="h-100 shadow-sm">
              <div style={{ aspectRatio: '16/9', background: '#e9ecef', overflow: 'hidden' }}>
                {s.photos?.[0] ? (
                  <img
                    src={photoURL(s.photos[0])}
                    alt={s.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div className="d-flex h-100 align-items-center justify-content-center text-secondary">
                    No photo
                  </div>
                )}
              </div>
              <Card.Body>
                <Card.Title className="h6">{s.name}</Card.Title>
                <div className="text-secondary small mb-3">{s.location?.city}</div>
                <div className="d-flex gap-2">
                  <Button
                    as={Link}
                    to={`/owner/stadiums/${s._id}`}
                    variant="success"
                    size="sm"
                    className="flex-grow-1"
                  >
                    Manage stadium
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => remove(s._id, s.name)}
                  >
                    Delete
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
