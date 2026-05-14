import { useMemo } from 'react';

const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

function fmtDate(d) {
  const date = new Date(`${d}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

/**
 * Props:
 *   dates: string[] YYYY-MM-DD (7 entries)
 *   slots: array of slot objects {date,startTime,endTime,status,reservedBy}
 *   mode: 'view' | 'manage' | 'reserve'
 *   currentUserId: string (for reserve mode highlighting)
 *   onEmptyClick(date, startTime)  // manage mode
 *   onSlotClick(slot)              // any mode
 */
export default function SlotGrid({
  dates,
  slots,
  mode = 'view',
  currentUserId,
  onEmptyClick,
  onSlotClick,
}) {
  const slotMap = useMemo(() => {
    const m = new Map();
    for (const s of slots) m.set(`${s.date}|${s.startTime}`, s);
    return m;
  }, [slots]);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="sticky left-0 z-10 w-20 border-b border-slate-200 bg-slate-50 px-2 py-2 text-left text-xs font-medium text-slate-500">
              Time
            </th>
            {dates.map((d) => (
              <th
                key={d}
                className="min-w-[110px] border-b border-l border-slate-200 px-2 py-2 text-xs font-medium text-slate-600"
              >
                {fmtDate(d)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map((time) => (
            <tr key={time}>
              <td className="sticky left-0 z-10 border-b border-slate-100 bg-white px-2 py-1 text-xs text-slate-500">
                {time}
              </td>
              {dates.map((date) => {
                const slot = slotMap.get(`${date}|${time}`);
                return (
                  <Cell
                    key={`${date}-${time}`}
                    date={date}
                    time={time}
                    slot={slot}
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
      <Legend mode={mode} />
    </div>
  );
}

function Cell({ date, time, slot, mode, currentUserId, onEmptyClick, onSlotClick }) {
  if (!slot) {
    const clickable = mode === 'manage';
    return (
      <td
        className={`h-9 border-b border-l border-slate-100 px-1 ${
          clickable ? 'cursor-pointer hover:bg-emerald-50' : ''
        }`}
        onClick={clickable ? () => onEmptyClick?.(date, time) : undefined}
      />
    );
  }

  const mine = currentUserId && slot.reservedBy === currentUserId;
  let bg = '';
  let label = slot.startTime;
  if (slot.status === 'available') {
    bg = 'bg-emerald-200 text-emerald-900 hover:bg-emerald-300';
  } else if (mine) {
    bg = 'bg-amber-300 text-amber-900';
    label = `${slot.startTime} (yours)`;
  } else {
    bg = 'bg-rose-300 text-rose-900';
  }

  const clickable =
    (mode === 'reserve' && slot.status === 'available') ||
    (mode === 'reserve' && mine) ||
    (mode === 'manage' && slot.status === 'available');

  return (
    <td
      onClick={clickable ? () => onSlotClick?.(slot) : undefined}
      className={`h-9 border-b border-l border-slate-100 px-1 text-xs ${bg} ${
        clickable ? 'cursor-pointer' : ''
      }`}
      title={`${slot.startTime}-${slot.endTime} · ${slot.status}`}
    >
      {label}
    </td>
  );
}

function Legend({ mode }) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded bg-emerald-200" /> Available
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block h-3 w-3 rounded bg-rose-300" /> Reserved
      </span>
      {mode === 'reserve' && (
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-amber-300" /> Your reservation
        </span>
      )}
      {mode === 'manage' && <span className="text-slate-400">Tip: click an empty cell to add a 1-hour slot</span>}
    </div>
  );
}
