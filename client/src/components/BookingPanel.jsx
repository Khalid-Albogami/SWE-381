import { useEffect, useMemo, useState } from 'react';

function dateParts(d) {
  const date = new Date(`${d}T00:00:00`);
  return {
    weekday: date.toLocaleDateString(undefined, { weekday: 'short' }),
    day: date.getDate(),
  };
}

function to12(time) {
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const pm = h >= 12;
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return { h, m: mStr, pm };
}

function fmtRange(start, end) {
  const a = to12(start);
  const b = to12(end);
  const aStr = `${a.h}:${a.m}`;
  const bStr = `${b.h}:${b.m}`;
  if (a.pm === b.pm) return `${aStr}–${bStr} ${a.pm ? 'pm' : 'am'}`;
  return `${aStr} ${a.pm ? 'pm' : 'am'} – ${bStr} ${b.pm ? 'pm' : 'am'}`;
}

function durationHours(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return Math.round((mins / 60) * 10) / 10;
}

function band(time) {
  const h = parseInt(time.slice(0, 2), 10);
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

const BANDS = [
  { key: 'morning', label: 'Morning' },
  { key: 'afternoon', label: 'Afternoon' },
  { key: 'evening', label: 'Evening' },
];

export default function BookingPanel({
  dates = [],
  slots = [],
  currentUserId,
  onSlotClick,
  interactive = true,
}) {
  const [selectedDate, setSelectedDate] = useState(dates[0] || '');

  useEffect(() => {
    if (dates.length && !dates.includes(selectedDate)) setSelectedDate(dates[0]);
  }, [dates, selectedDate]);

  const slotsByDate = useMemo(() => {
    const m = new Map();
    for (const s of slots) {
      if (!m.has(s.date)) m.set(s.date, []);
      m.get(s.date).push(s);
    }
    for (const arr of m.values()) arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return m;
  }, [slots]);

  const todays = slotsByDate.get(selectedDate) || [];
  const grouped = useMemo(() => {
    const g = { morning: [], afternoon: [], evening: [] };
    for (const s of todays) g[band(s.startTime)].push(s);
    return g;
  }, [todays]);

  const dateHasSomething = useMemo(() => {
    const set = new Set();
    for (const s of slots) {
      if (s.status === 'available' || (currentUserId && s.reservedBy === currentUserId)) {
        set.add(s.date);
      }
    }
    return set;
  }, [slots, currentUserId]);

  const monthLabel = selectedDate
    ? new Date(`${selectedDate}T00:00:00`).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="booking-card">
      <div className="d-flex justify-content-between align-items-center">
        <h2 className="h5 m-0 booking-title">Book a slot</h2>
        <span className="booking-month">{monthLabel}</span>
      </div>

      <ul className="date-strip">
        {dates.map((d) => {
          const { weekday, day } = dateParts(d);
          const isSelected = d === selectedDate;
          const isEmpty = !dateHasSomething.has(d);
          return (
            <li key={d}>
              <button
                type="button"
                onClick={() => setSelectedDate(d)}
                className={`day-chip ${isSelected ? 'day-chip--selected' : ''} ${
                  isEmpty ? 'day-chip--empty' : ''
                }`}
              >
                <span className="day-chip-weekday">{weekday}</span>
                <span className="day-chip-day">{day}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {todays.length === 0 ? (
        <div className="booking-empty">No slots posted for this day.</div>
      ) : (
        BANDS.map((b) =>
          grouped[b.key].length > 0 ? (
            <div key={b.key}>
              <h3 className="time-group-label">{b.label}</h3>
              <div className="time-grid">
                {grouped[b.key].map((s) => {
                  const mine = currentUserId && s.reservedBy === currentUserId;
                  const isAvailable = s.status === 'available';
                  const clickable = interactive && (isAvailable || mine);
                  const cls = mine
                    ? 'slot-chip slot-chip--mine'
                    : isAvailable
                    ? 'slot-chip'
                    : 'slot-chip slot-chip--disabled';
                  const dur = durationHours(s.startTime, s.endTime);
                  return (
                    <button
                      key={s._id}
                      type="button"
                      disabled={!clickable}
                      onClick={() => onSlotClick?.(s)}
                      className={cls}
                      title={`${s.startTime}–${s.endTime} · ${dur}h${
                        mine ? ' · your booking' : isAvailable ? '' : ' · taken'
                      }`}
                    >
                      <div className="slot-chip-range">{fmtRange(s.startTime, s.endTime)}</div>
                      <div className="slot-chip-duration">{dur}h</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null
        )
      )}

      <div className="booking-legend">
        <span className="booking-legend-item">
          <span className="legend-dot legend-dot--available" /> Available
        </span>
        <span className="booking-legend-item">
          <span className="legend-dot legend-dot--mine" /> Yours
        </span>
        <span className="booking-legend-item">
          <span className="legend-dot legend-dot--taken" /> Taken
        </span>
      </div>
    </div>
  );
}
