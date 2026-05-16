import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

const ROLES = [
  { value: 'user', label: 'Match organizer', sub: 'Find and book pitches' },
  { value: 'owner', label: 'Stadium owner', sub: 'List pitches and slots' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await register(form);
      navigate(user.role === 'owner' ? '/owner' : '/', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mx-auto mt-5 shadow-sm" style={{ maxWidth: 460 }}>
      <Card.Body className="p-4">
        <Card.Title as="h1" className="h4 mb-3">Create account</Card.Title>

        <Row className="g-2 mb-3">
          {ROLES.map((opt) => {
            const active = form.role === opt.value;
            return (
              <Col key={opt.value} xs={6}>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, role: opt.value }))}
                  className={`btn w-100 text-start p-3 ${active ? 'btn-success' : 'btn-outline-secondary'}`}
                >
                  <div className="fw-semibold">{opt.label}</div>
                  <div className="small">{opt.sub}</div>
                </button>
              </Col>
            );
          })}
        </Row>

        <Form onSubmit={submit}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control required value={form.name} onChange={set('name')} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" required value={form.email} onChange={set('email')} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control type="password" required value={form.password} onChange={set('password')} />
          </Form.Group>
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
          <Button type="submit" variant="success" className="w-100" disabled={busy}>
            {busy ? 'Creating...' : 'Create account'}
          </Button>
        </Form>
        <p className="text-center text-secondary small mt-3 mb-0">
          Already have an account?{' '}
          <Link to="/login" className="text-success fw-medium">Sign in</Link>
        </p>
      </Card.Body>
    </Card>
  );
}
