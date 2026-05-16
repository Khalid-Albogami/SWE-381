import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import { stadiums as stadiumsApi } from '../../api/endpoints';

export default function AddStadium() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', description: '', city: '', address: '' });
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      for (const file of files) fd.append('photos', file);
      const created = await stadiumsApi.create(fd);
      navigate(`/owner/stadiums/${created._id}`);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to create');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container className="py-4" style={{ maxWidth: 720 }}>
      <h1 className="h3 mb-3">Add a stadium</h1>
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <Form onSubmit={submit}>
            <Form.Group className="mb-3">
              <Form.Label>Name</Form.Label>
              <Form.Control required value={form.name} onChange={set('name')} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>City</Form.Label>
              <Form.Control required value={form.city} onChange={set('city')} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control
                value={form.address}
                onChange={set('address')}
                placeholder="Street address or a Google Maps URL"
              />
              <Form.Text>Paste a Google Maps link here and it will show as a clickable map pin.</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} value={form.description} onChange={set('description')} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Photos (up to 8, images only, 10 MB each)</Form.Label>
              <Form.Control
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
              />
              {files.length > 0 && (
                <Form.Text>{files.length} file(s) selected</Form.Text>
              )}
            </Form.Group>
            {error && <Alert variant="danger" className="py-2 small">{error}</Alert>}
            <Button type="submit" variant="success" className="w-100" disabled={busy}>
              {busy ? 'Saving...' : 'Create stadium'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
