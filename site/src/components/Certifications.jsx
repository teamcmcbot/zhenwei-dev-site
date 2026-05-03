import PropTypes from "prop-types";

function isCredentialUrl(url) {
  if (!url || url.trim() === "" || url.trim() === "#") {
    return false;
  }

  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export default function Certifications({ certifications }) {
  return (
    <section id="certifications" className="card" aria-labelledby="certifications-title">
      <h2 id="certifications-title">Certifications</h2>
      <div className="cert-grid">
        {certifications.map((certification) => {
          const hasCredentialLink = isCredentialUrl(certification.credentialUrl);
          const hasBadgeImage = Boolean(certification.badgeImage);

          return (
            <article key={certification.name} className="cert-card">
              <div className="cert-card-body">
              {hasCredentialLink ? (
                <h3>
                  <a
                    className="cert-title-link"
                    href={certification.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {certification.name}
                  </a>
                </h3>
              ) : (
                <h3>{certification.name}</h3>
              )}
              <p className="meta">{certification.issuer}</p>
              <p className="meta">Issued: {certification.issuedDate}</p>
              {hasCredentialLink && (
                <a
                  className="credential-link"
                  href={certification.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Credential
                </a>
              )}
              </div>
              {hasBadgeImage &&
                (hasCredentialLink ? (
                  <a
                    className="cert-badge-link"
                    href={certification.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open credential for ${certification.name}`}
                  >
                    <img
                      className="cert-badge"
                      src={certification.badgeImage}
                      alt={`${certification.name} badge`}
                      loading="lazy"
                    />
                  </a>
                ) : (
                  <img
                    className="cert-badge"
                    src={certification.badgeImage}
                    alt={`${certification.name} badge`}
                    loading="lazy"
                  />
                ))}
            </article>
          );
        })}
      </div>
    </section>
  );
}

Certifications.propTypes = {
  certifications: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      issuer: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      issuedDate: PropTypes.string.isRequired,
      expirationDate: PropTypes.string.isRequired,
      credentialUrl: PropTypes.string,
      badgeImage: PropTypes.string
    })
  ).isRequired
};
