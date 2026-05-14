import { useEffect, useState } from 'react';
import { stats as statsApi } from '../../api/endpoints';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

export default function Statistics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    statsApi
      .owner()
      .then(setData)
      .catch((e) => setError(e?.response?.data?.error || 'Failed to load'));
  }, []);

  if (error) return <div className="mx-auto max-w-4xl px-4 py-8 text-rose-700">{error}</div>;
  if (!data) return <div className="mx-auto max-w-4xl px-4 py-8 text-slate-500">Loading...</div>;

  const barData = {
    labels: data.perDay.map((d) => d.date.slice(5)),
    datasets: [
      {
        label: 'Reservations',
        data: data.perDay.map((d) => d.count),
        backgroundColor: 'rgba(16,185,129,0.7)',
        borderRadius: 4,
      },
    ],
  };

  const pieData = {
    labels: ['Available', 'Reserved'],
    datasets: [
      {
        data: [data.statusBreakdown.available, data.statusBreakdown.reserved],
        backgroundColor: ['rgba(16,185,129,0.7)', 'rgba(244,63,94,0.7)'],
      },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Statistics</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Reservations (all-time)" value={data.totals.allTime} />
        <Stat label="Reservations (last 7 days)" value={data.totals.last7Days} />
        <Stat
          label="Most reserved"
          value={data.mostReserved ? data.mostReserved.stadiumName : '—'}
          sub={data.mostReserved ? `${data.mostReserved.reserved} reservations` : ''}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card title="Reservations per day (last 7)">
          <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
        </Card>
        <Card title="Slot status">
          <Pie data={pieData} options={{ responsive: true }} />
        </Card>
      </div>

      <Card title="Occupancy per stadium" className="mt-6">
        {data.perStadium.length === 0 ? (
          <p className="text-sm text-slate-500">No stadiums yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1">Stadium</th>
                <th className="py-1">Slots</th>
                <th className="py-1">Reserved</th>
                <th className="py-1">Occupancy</th>
              </tr>
            </thead>
            <tbody>
              {data.perStadium.map((p) => (
                <tr key={p.stadiumId} className="border-t border-slate-100">
                  <td className="py-1.5">{p.stadiumName}</td>
                  <td className="py-1.5">{p.total}</td>
                  <td className="py-1.5">{p.reserved}</td>
                  <td className="py-1.5">{Math.round(p.occupancyRate * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function Card({ title, children, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      <h3 className="mb-3 text-sm font-medium text-slate-700">{title}</h3>
      {children}
    </div>
  );
}
