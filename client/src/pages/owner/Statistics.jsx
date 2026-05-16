import { useEffect, useState } from 'react';
import { Container, Card, Row, Col, Spinner, Alert, Table } from 'react-bootstrap';
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

  if (error) return <Container className="py-4"><Alert variant="danger">{error}</Alert></Container>;
  if (!data) return (
    <Container className="py-5 text-center text-secondary">
      <Spinner animation="border" size="sm" className="me-2" /> Loading...
    </Container>
  );

  const barData = {
    labels: data.perDay.map((d) => d.date.slice(5)),
    datasets: [
      {
        label: 'Reservations',
        data: data.perDay.map((d) => d.count),
        backgroundColor: 'rgba(25,135,84,0.7)',
        borderRadius: 4,
      },
    ],
  };

  const pieData = {
    labels: ['Available', 'Reserved'],
    datasets: [
      {
        data: [data.statusBreakdown.available, data.statusBreakdown.reserved],
        backgroundColor: ['rgba(25,135,84,0.7)', 'rgba(220,53,69,0.7)'],
      },
    ],
  };

  return (
    <Container className="py-4">
      <h1 className="h3 mb-4">Statistics</h1>

      <Row className="g-3 mb-4">
        <Col md={4}><Stat label="Reservations (all-time)" value={data.totals.allTime} /></Col>
        <Col md={4}><Stat label="Reservations (last 7 days)" value={data.totals.last7Days} /></Col>
        <Col md={4}>
          <Stat
            label="Most reserved"
            value={data.mostReserved ? data.mostReserved.stadiumName : '—'}
            sub={data.mostReserved ? `${data.mostReserved.reserved} reservations` : ''}
          />
        </Col>
      </Row>

      <Row className="g-3">
        <Col lg={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="h6">Reservations per day (last 7)</Card.Title>
              <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </Card.Body>
          </Card>
        </Col>
        <Col lg={6}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title className="h6">Slot status</Card.Title>
              <Pie data={pieData} options={{ responsive: true }} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="shadow-sm mt-3">
        <Card.Body>
          <Card.Title className="h6">Occupancy per stadium</Card.Title>
          {data.perStadium.length === 0 ? (
            <p className="text-secondary small mb-0">No stadiums yet.</p>
          ) : (
            <Table size="sm" className="mb-0">
              <thead className="text-muted">
                <tr>
                  <th>Stadium</th>
                  <th>Slots</th>
                  <th>Reserved</th>
                  <th>Occupancy</th>
                </tr>
              </thead>
              <tbody>
                {data.perStadium.map((p) => (
                  <tr key={p.stadiumId}>
                    <td>{p.stadiumName}</td>
                    <td>{p.total}</td>
                    <td>{p.reserved}</td>
                    <td>{Math.round(p.occupancyRate * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
}

function Stat({ label, value, sub }) {
  return (
    <Card className="shadow-sm h-100">
      <Card.Body>
        <div className="text-uppercase text-muted small">{label}</div>
        <div className="h4 mt-1 mb-0">{value}</div>
        {sub && <div className="text-secondary small">{sub}</div>}
      </Card.Body>
    </Card>
  );
}
