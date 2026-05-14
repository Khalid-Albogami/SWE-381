import { Link } from 'react-router-dom';
import { photoURL } from '../api/axios';
import AddressLine from './AddressLine';

export default function StadiumCard({ stadium, to }) {
  const cover = stadium.photos?.[0];
  return (
    <Link
      to={to}
      className="block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-[16/9] bg-slate-200">
        {cover ? (
          <img src={photoURL(cover)} alt={stadium.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">No photo</div>
        )}
      </div>
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
