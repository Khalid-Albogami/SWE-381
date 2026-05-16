import { useEffect, useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { stadiums as stadiumsApi } from '../api/endpoints';
import StadiumCard from '../components/StadiumCard';

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function next7DaysOptions() {
  const out = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < 7; i++) {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    out.push(x.toISOString().slice(0, 10));
  }
  return out;
}

export default function Home() {
  const [city, setCity] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetch = (params = {}) => {
    setLoading(true);
    setError('');
    stadiumsApi
      .list(params)
      .then(setItems)
      .catch((e) => setError(e?.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const submit = (e) => {
    e.preventDefault();
    const params = {};
    if (city.trim()) params.city = city.trim();
    if (date) params.date = date;
    if (startTime) params.startTime = startTime;
    fetch(params);
  };

  const reset = () => {
    setCity(''); setDate(''); setStartTime('');
    fetch();
  };

  return (
    <Container className="py-4">
      <Card body className="text-white shadow-sm border-0" style={{ background: 'linear-gradient(135deg,#198754,#146c43)' }}>
        <h1 className="h2 fw-bold mb-1">Find and book a soccer pitch.</h1>
        <p className="mb-0">Browse stadiums, pick a free time slot from the 7-day grid, and reserve in seconds.</p>
      </Card>

      <Form onSubmit={submit} className="mt-4">
        <Card body className="shadow-sm">
          <Row className="g-2 align-items-end">
            <Col md>
              <Form.Label className="small text-muted mb-1">City</Form.Label>
              <Form.Control
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Riyadh"
              />
            </Col>
            <Col md={2}>
              <Form.Label className="small text-muted mb-1">Date</Form.Label>
              <Form.Select value={date} onChange={(e) => setDate(e.target.value)}>
                <option value="">Any date</option>
                {next7DaysOptions().map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Label className="small text-muted mb-1">Time</Form.Label>
              <Form.Select value={startTime} onChange={(e) => setStartTime(e.target.value)}>
                <option value="">Any time</option>
                {HOURS.map((h) => <option key={h} value={h}>{h}</option>)}
              </Form.Select>
            </Col>
            <Col md="auto">
              <Button type="submit" variant="success">
                <i className="bi bi-search me-1" /> Search
              </Button>
            </Col>
            {(city || date || startTime) && (
              <Col md="auto">
                <Button type="button" variant="outline-secondary" onClick={reset}>Reset</Button>
              </Col>
            )}
          </Row>
        </Card>
      </Form>

      {loading && (
        <div className="text-center py-5 text-secondary">
          <Spinner animation="border" size="sm" className="me-2" /> Loading...
        </div>
      )}
      {error && <Alert variant="danger" className="mt-4">{error}</Alert>}
      {!loading && !error && items.length === 0 && (
        <Card body className="text-center text-secondary mt-5 border-dashed">
          No stadiums match your search.
        </Card>
      )}

      <Row className="mt-4 g-3">
        {items.map((s) => (
          <Col key={s._id} sm={6} lg={4}>
            <StadiumCard stadium={s} to={`/stadiums/${s._id}`} />
          </Col>
        ))}
      </Row>
    </Container>
  );
}
