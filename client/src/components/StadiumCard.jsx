import { Link } from 'react-router-dom';
import { Card } from 'react-bootstrap';
import AddressLine from './AddressLine';
import Carousel from './Carousel';

export default function StadiumCard({ stadium, to }) {
  return (
    <Card as={Link} to={to} className="h-100 text-decoration-none text-reset shadow-sm">
      <Carousel photos={stadium.photos} alt={stadium.name} rounded="rounded-0" />
      <Card.Body>
        <Card.Title className="h6 mb-1">{stadium.name}</Card.Title>
        <div className="text-secondary small mb-2">
          <AddressLine
            city={stadium.location?.city}
            address={stadium.location?.address}
            asLink={false}
          />
        </div>
        {stadium.description && (
          <Card.Text className="small text-body-secondary" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {stadium.description}
          </Card.Text>
        )}
      </Card.Body>
    </Card>
  );
}
