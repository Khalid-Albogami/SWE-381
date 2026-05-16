import { useEffect, useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { slots as slotsApi } from '../api/endpoints';
import { useToast, useConfirm } from './feedback';
import { formatSAR } from '../utils/currency';

export default function SlotEditModal({ slot, pitch, show, onHide, onChange }) {
  const toast = useToast();
  const confirm = useConfirm();
  const [price, setPrice] = useState(slot?.price ?? 0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (slot) setPrice(slot.price);
  }, [slot]);

  if (!slot) return null;

  const duration = durationHours(slot.startTime, slot.endTime);
  const defaultPrice = pitch ? Math.round(pitch.pricePerHour * duration) : null;

  const save = async (e) => {
    e?.preventDefault?.();
    const n = Number(price);
    if (Number.isNaN(n) || n < 0) {
      toast.error('Enter a valid non-negative price');
      return;
    }
    setBusy(true);
    try {
      await slotsApi.update(slot._id, { price: n });
      toast.success('Slot updated');
      onChange?.();
      onHide();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to update slot');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const ok = await confirm({
      title: 'Delete this slot?',
      message: `${slot.date} at ${slot.startTime}–${slot.endTime}`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    setBusy(true);
    try {
      await slotsApi.remove(slot._id);
      toast.success('Slot deleted');
      onChange?.();
      onHide();
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to delete slot');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title className="h5">Edit slot</Modal.Title>
      </Modal.Header>
      <Form onSubmit={save}>
        <Modal.Body>
          <p className="text-secondary small mb-2">
            <i className="bi bi-calendar3 me-1" />
            {slot.date} · {slot.startTime}–{slot.endTime} ({duration}h)
            {pitch && <> · {pitch.name}</>}
          </p>
          <Form.Group>
            <Form.Label>Price</Form.Label>
            <div className="input-group">
              <Form.Control
                type="number"
                min="0"
                step="1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
              <span className="input-group-text">SAR</span>
            </div>
            {defaultPrice !== null && (
              <Form.Text>
                Default at this pitch's rate: {formatSAR(defaultPrice)}
                {defaultPrice !== Number(price) && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="p-0 ms-2"
                    onClick={() => setPrice(defaultPrice)}
                  >
                    Reset to default
                  </Button>
                )}
              </Form.Text>
            )}
          </Form.Group>
          {slot.status === 'reserved' && (
            <Alert variant="warning" className="mt-3 small mb-0">
              This slot is reserved — price and slot itself are locked.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="justify-content-between">
          <Button
            type="button"
            variant="outline-danger"
            onClick={remove}
            disabled={busy || slot.status === 'reserved'}
          >
            <i className="bi bi-trash me-1" /> Delete slot
          </Button>
          <div className="d-flex gap-2">
            <Button type="button" variant="outline-secondary" onClick={onHide} disabled={busy}>
              Close
            </Button>
            <Button
              type="submit"
              variant="success"
              disabled={busy || slot.status === 'reserved'}
            >
              Save
            </Button>
          </div>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

function durationHours(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return Math.round((mins / 60) * 10) / 10;
}
