import { useMemo } from 'react';

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function fmtDate(d) {
  const date = new Date(`${d}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function SlotGrid({
  dates,
  slots,
  mode = 'view',
  currentUserId,
  onEmptyClick,
  onSlotClick,
}) {
  const blockMap = useMemo(() => {
    const m = new Map();
    for (const s of slots) {
      const sh = Number(s.startTime.slice(0, 2));
      const eh = Number(s.endTime.slice(0, 2));
      const end = eh > sh ? eh : eh + 24;
      for (let h = sh; h < end; h++) {
        const hour = `${String(h % 24).padStart(2, '0')}:00`;
        m.set(`${s.date}|${hour}`, { slot: s, isStart: h === sh });
      }
    }
    return m;
  }, [slots]);

  return (
    <div className="card border">
      <div className="table-responsive">
        <table className="table table-borderless mb-0 small">
          <thead className="table-light">
            <tr>
              <th className="text-muted" style={{ width: '5rem' }}>Time</th>
              {dates.map((d) => (
                <th key={d} className="text-muted" style={{ minWidth: 110 }}>
                  {fmtDate(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {HOURS.map((time) => (
              <tr key={time}>
                <td className="text-muted small">{time}</td>
                {dates.map((date) => {
                  const occ = blockMap.get(`${date}|${time}`);
                  return (
                    <Cell
                      key={`${date}-${time}`}
                      date={date}
                      time={time}
                      occ={occ}
                      mode={mode}
                      currentUserId={currentUserId}
                      onEmptyClick={onEmptyClick}
                      onSlotClick={onSlotClick}
                    />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Legend mode={mode} />
    </div>
  );
}

function Cell({ date, time, occ, mode, currentUserId, onEmptyClick, onSlotClick }) {
  if (!occ) {
    const clickable = mode === 'manage';
    return (
      <td
        className={`slot-cell ${clickable ? 'bg-light-subtle' : ''}`}
        style={clickable ? { cursor: 'pointer' } : undefined}
        onClick={clickable ? () => onEmptyClick?.(date, time) : undefined}
      />
    );
  }

  const { slot, isStart } = occ;
  const mine = currentUserId && slot.reservedBy === currentUserId;
  let stateClass = 'slot-available';
  if (slot.status === 'reserved') stateClass = mine ? 'slot-mine' : 'slot-reserved';

  let label = '';
  if (isStart) {
    label = `${slot.startTime}–${slot.endTime}`;
    if (mine) label += ' (yours)';
  }

  const clickable =
    (mode === 'reserve' && slot.status === 'available') ||
    (mode === 'reserve' && mine) ||
    (mode === 'manage' && slot.status === 'available');

  return (
    <td
      onClick={clickable ? () => onSlotClick?.(slot) : undefined}
      className={`slot-cell ${stateClass}`}
      style={clickable ? { cursor: 'pointer' } : undefined}
      title={`${slot.startTime}–${slot.endTime} · ${slot.status}`}
    >
      {label}
    </td>
  );
}

function Legend({ mode }) {
  return (
    <div className="card-footer bg-light small text-muted d-flex flex-wrap gap-3 align-items-center">
      <span><span className="d-inline-block me-1 slot-available" style={{ width: 12, height: 12, borderRadius: 2 }} /> Available</span>
      <span><span className="d-inline-block me-1 slot-reserved" style={{ width: 12, height: 12, borderRadius: 2 }} /> Reserved</span>
      {mode === 'reserve' && (
        <span><span className="d-inline-block me-1 slot-mine" style={{ width: 12, height: 12, borderRadius: 2 }} /> Your reservation</span>
      )}
      {mode === 'manage' && <span className="text-secondary">Tip: click an empty cell to add a 1-hour slot</span>}
    </div>
  );
}
