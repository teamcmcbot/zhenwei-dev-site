import PropTypes from "prop-types";

export default function Hero({ profile }) {
  return (
    <section className="hero card" aria-labelledby="hero-title">
      <div className="hero-content">
        <div className="hero-text">
          <p className="eyebrow">{profile.role}</p>
          <h1 id="hero-title">{profile.headline}</h1>
          <p className="lead">{profile.summary}</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href={profile.primaryAction?.href || "#about"}>
              {profile.primaryAction?.label || "View"}
            </a>
            <a className="btn btn-secondary" href={profile.secondaryAction?.href || "#about"}>
              {profile.secondaryAction?.label || "Contact"}
            </a>
          </div>
        </div>
        {profile.imageUrl && (
          <div className="hero-image-wrap">
            <img
              className="hero-avatar"
              src={profile.imageUrl}
              alt={profile.name ? `${profile.name} profile photo` : "Profile photo"}
            />
          </div>
        )}
      </div>
    </section>
  );
}

Hero.propTypes = {
  profile: PropTypes.shape({
    role: PropTypes.string,
    headline: PropTypes.string,
    summary: PropTypes.string,
    imageUrl: PropTypes.string,
    primaryAction: PropTypes.shape({
      href: PropTypes.string,
      label: PropTypes.string
    }),
    secondaryAction: PropTypes.shape({
      href: PropTypes.string,
      label: PropTypes.string
    })
  }).isRequired
};
