import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(email, password);
      const from = location.state?.from?.pathname;
      navigate(from || (user.role === 'owner' ? '/owner' : '/'), { replace: true });
    } catch (err) {
      setError(err?.response?.data?.error || 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mx-auto mt-5 shadow-sm" style={{ maxWidth: 420 }}>
      <Card.Body className="p-4">
        <Card.Title as="h1" className="h4 mb-3">Sign in</Card.Title>
        <Form onSubmit={submit}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>
          {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
          <Button type="submit" variant="success" className="w-100" disabled={busy}>
            {busy ? 'Signing in...' : 'Sign in'}
          </Button>
        </Form>
        <p className="text-center text-secondary small mt-3 mb-0">
          New here?{' '}
          <Link to="/register" className="text-success fw-medium">Create an account</Link>
        </p>
      </Card.Body>
    </Card>
  );
}
