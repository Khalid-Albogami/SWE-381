import { Link } from 'react-router-dom';
import AddressLine from './AddressLine';
import Carousel from './Carousel';

export default function StadiumCard({ stadium, to }) {
  return (
    <Link
      to={to}
      className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <Carousel photos={stadium.photos} alt={stadium.name} rounded="rounded-none" />
      <div className="p-4">
        <h3 className="text-base font-semibold text-slate-900">{stadium.name}</h3>
        <p className="mt-1 text-sm text-slate-500">
          <AddressLine city={stadium.location?.city} address={stadium.location?.address} />
        </p>
        {stadium.description && (
          <p className="mt-2 line-clamp-2 text-sm text-slate-600">{stadium.description}</p>
        )}
      </div>
    </Link>
  );
}
