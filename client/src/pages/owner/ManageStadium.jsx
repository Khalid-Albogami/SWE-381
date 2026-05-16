import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Button, Row, Col, Alert, Form } from 'react-bootstrap';
import { slots as slotsApi, stadiums as stadiumsApi } from '../../api/endpoints';
import { photoURL } from '../../api/axios';
import SlotGrid from '../../components/SlotGrid';
import AddressLine from '../../components/AddressLine';
import { useToast, useConfirm } from '../../components/feedback';

const SLOT_HOURS = 2;

function plusSlotHours(hhmm) {
  const [h] = hhmm.split(':');
  return `${String(Number(h) + SLOT_HOURS).padStart(2, '0')}:00`;
}

export default function ManageStadium() {
  const { id } = useParams();
  const toast = useToast();
  const confirm = useConfirm();
  const [stadium, setStadium] = useState(null);
  const [dates, setDates] = useState([]);
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const data = await slotsApi.forStadium(id);
      setDates(data.dates);
      setSlots(data.slots);
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to load');
    }
  }, [id]);

  useEffect(() => {
    stadiumsApi.get(id).then(setStadium).catch(() => {});
    refresh();
  }, [id, refresh]);

  const createSlot = async (date, startTime) => {
    const startHour = Number(startTime.slice(0, 2));
    if (startHour + SLOT_HOURS >= 24) {
      toast.error(`Slots are ${SLOT_HOURS} hours long — cannot start later than 21:00`);
      return;
    }
    try {
      await slotsApi.create({ stadiumId: id, date, startTime, endTime: plusSlotHours(startTime) });
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Could not add slot');
    }
  };

  const deleteSlot = async (slot) => {
    const ok = await confirm({
      title: 'Delete this slot?',
      message: `${slot.date} at ${slot.startTime}`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await slotsApi.remove(slot._id);
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Could not delete');
    }
  };

  const deletePhoto = async (filename) => {
    const ok = await confirm({
      title: 'Delete this photo?',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      const updated = await stadiumsApi.removePhoto(id, filename);
      setStadium(updated);
      toast.success('Photo deleted');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Delete failed');
    }
  };

  const uploadPhotos = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      for (const f of files) fd.append('photos', f);
      const updated = await stadiumsApi.update(id, fd);
      setStadium(updated);
      toast.success(`Uploaded ${files.length} photo${files.length === 1 ? '' : 's'}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Container className="py-4">
      <div className="mb-3">
        <Link to="/owner" className="text-success small text-decoration-none">
          <i className="bi bi-arrow-left me-1" /> Back to stadiums
        </Link>
        <h1 className="h3 mt-1 mb-0">{stadium ? stadium.name : 'Manage stadium'}</h1>
        {stadium && (
          <div className="text-secondary small">
            <AddressLine city={stadium.location?.city} address={stadium.location?.address} />
          </div>
        )}
      </div>

      {stadium && (
        <Card className="mb-4 shadow-sm">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <h2 className="h6 mb-0">Photos</h2>
              <Form.Label className="btn btn-outline-success btn-sm mb-0" htmlFor="photo-upload">
                <i className="bi bi-plus-lg me-1" />
                {uploading ? 'Uploading...' : 'Add photos'}
              </Form.Label>
              <Form.Control
                id="photo-upload"
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                disabled={uploading}
                onChange={uploadPhotos}
                className="d-none"
              />
            </div>
            <div className="text-secondary small mt-1">Up to 8 per upload, 10 MB each.</div>
            {stadium.photos?.length ? (
              <Row className="g-2 mt-1">
                {stadium.photos.map((p) => {
                  const filename = p.split('/').pop();
                  return (
                    <Col key={p} xs={6} sm={4} md={3} lg={2}>
                      <div className="photo-thumb">
                        <img src={photoURL(p)} alt={stadium.name} />
                        <button
                          type="button"
                          onClick={() => deletePhoto(filename)}
                          title="Delete photo"
                          className="remove-btn"
                        >
                          <i className="bi bi-x" />
                        </button>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            ) : (
              <div className="text-secondary small mt-3">No photos yet.</div>
            )}
          </Card.Body>
        </Card>
      )}

      <h2 className="h6 mb-1">Slots</h2>
      <p className="text-secondary small">
        Click an empty cell to add a 1-hour slot. Click a green cell to delete it. Red cells are reserved and locked.
      </p>
      {error && <Alert variant="danger">{error}</Alert>}
      {dates.length > 0 && (
        <SlotGrid
          dates={dates}
          slots={slots}
          mode="manage"
          onEmptyClick={createSlot}
          onSlotClick={deleteSlot}
        />
      )}
    </Container>
  );
}
