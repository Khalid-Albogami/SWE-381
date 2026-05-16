function isUrl(s) {
  return /^https?:\/\//i.test(s.trim());
}

export default function AddressLine({ city, address, className = '', asLink = true }) {
  if (!city && !address) return null;
  const linkAddr = address && isUrl(address) ? address.trim() : null;
  return (
    <span className={className}>
      {city}
      {address && (
        <>
          {city ? ' — ' : ''}
          {linkAddr ? (
            asLink ? (
              <a
                href={linkAddr}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-success text-decoration-none fw-medium"
              >
                <i className="bi bi-geo-alt-fill me-1" />
                Open in maps
              </a>
            ) : (
              <span className="text-success fw-medium">
                <i className="bi bi-geo-alt-fill me-1" />
                Map available
              </span>
            )
          ) : (
            address
          )}
        </>
      )}
    </span>
  );
}
