import { useState } from 'react';
import { Card, Form, Button, Row, Col, ListGroup, Badge } from 'react-bootstrap';
import { pitches as pitchesApi } from '../api/endpoints';
import { useToast, useConfirm } from './feedback';
import { formatSAR } from '../utils/currency';

export default function PitchesPanel({ stadiumId, pitches, onChange }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', pricePerHour: '' });

  const startAdd = () => {
    setEditingId(null);
    setForm({ name: '', description: '', pricePerHour: '' });
    setAdding(true);
  };
  const startEdit = (p) => {
    setAdding(false);
    setEditingId(p._id);
    setForm({ name: p.name, description: p.description || '', pricePerHour: String(p.pricePerHour) });
  };
  const cancel = () => {
    setAdding(false);
    setEditingId(null);
    setForm({ name: '', description: '', pricePerHour: '' });
  };

  const submit = async (e) => {
    e.preventDefault();
    const price = Number(form.pricePerHour);
    if (!form.name.trim() || Number.isNaN(price) || price < 0) {
      toast.error('Name and a valid price are required');
      return;
    }
    try {
      if (editingId) {
        await pitchesApi.update(editingId, {
          name: form.name.trim(),
          description: form.description,
          pricePerHour: price,
        });
        toast.success('Pitch updated');
      } else {
        await pitchesApi.create({
          stadiumId,
          name: form.name.trim(),
          description: form.description,
          pricePerHour: price,
        });
        toast.success('Pitch added');
      }
      cancel();
      onChange?.();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to save pitch');
    }
  };

  const remove = async (p) => {
    const ok = await confirm({
      title: 'Delete pitch?',
      message: `"${p.name}" and all of its slots will be permanently deleted.`,
      confirmLabel: 'Delete pitch',
      danger: true,
    });
    if (!ok) return;
    try {
      await pitchesApi.remove(p._id);
      toast.success('Pitch deleted');
      onChange?.();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to delete pitch');
    }
  };

  return (
    <Card className="shadow-sm mb-4">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <h2 className="h6 mb-0">Pitches</h2>
          {!adding && !editingId && (
            <Button variant="outline-success" size="sm" onClick={startAdd}>
              <i className="bi bi-plus-lg me-1" /> Add pitch
            </Button>
          )}
        </div>
        <div className="text-secondary small mt-1">
          Each pitch has its own hourly rate; slot prices default to <em>rate × duration</em>.
        </div>

        {pitches.length === 0 && !adding && (
          <div className="text-secondary small mt-3">
            No pitches yet. Add at least one pitch before posting slots.
          </div>
        )}

        {pitches.length > 0 && (
          <ListGroup variant="flush" className="mt-3">
            {pitches.map((p) =>
              editingId === p._id ? (
                <ListGroup.Item key={p._id} className="px-0">
                  <PitchForm form={form} setForm={setForm} onSubmit={submit} onCancel={cancel} editing />
                </ListGroup.Item>
              ) : (
                <ListGroup.Item key={p._id} className="px-0 d-flex align-items-center gap-2">
                  <div className="flex-grow-1">
                    <div className="fw-semibold">
                      {p.name}{' '}
                      <Badge bg="light" text="dark" className="ms-1 fw-normal">
                        {formatSAR(p.pricePerHour)} / hour
                      </Badge>
                    </div>
                    {p.description && (
                      <div className="text-secondary small">{p.description}</div>
                    )}
                  </div>
                  <Button variant="outline-secondary" size="sm" onClick={() => startEdit(p)}>
                    Edit
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => remove(p)}>
                    Delete
                  </Button>
                </ListGroup.Item>
              )
            )}
          </ListGroup>
        )}

        {adding && (
          <div className="mt-3">
            <PitchForm form={form} setForm={setForm} onSubmit={submit} onCancel={cancel} />
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

function PitchForm({ form, setForm, onSubmit, onCancel, editing }) {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <Form onSubmit={onSubmit}>
      <Row className="g-2">
        <Col md={5}>
          <Form.Control
            placeholder="Pitch name (e.g., 5-a-side A)"
            value={form.name}
            onChange={set('name')}
            required
          />
        </Col>
        <Col md={3}>
          <div className="input-group">
            <Form.Control
              type="number"
              min="0"
              step="1"
              placeholder="Price / hour"
              value={form.pricePerHour}
              onChange={set('pricePerHour')}
              required
            />
            <span className="input-group-text">SAR</span>
          </div>
        </Col>
        <Col md={4}>
          <Form.Control
            placeholder="Description (optional)"
            value={form.description}
            onChange={set('description')}
          />
        </Col>
      </Row>
      <div className="d-flex gap-2 mt-2">
        <Button type="submit" variant="success" size="sm">
          {editing ? 'Save' : 'Add pitch'}
        </Button>
        <Button type="button" variant="outline-secondary" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Form>
  );
}
