function isUrl(s) {
  return /^https?:\/\//i.test(s.trim());
}

export default function AddressLine({ city, address, className = '' }) {
  if (!city && !address) return null;
  const linkAddr = address && isUrl(address) ? address.trim() : null;
  return (
    <span className={className}>
      {city}
      {address && (
        <>
          {city ? ' — ' : ''}
          {linkAddr ? (
            <a
              href={linkAddr}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-medium text-emerald-700 hover:underline"
            >
              📍 Open in maps
            </a>
          ) : (
            address
          )}
        </>
      )}
    </span>
  );
}
