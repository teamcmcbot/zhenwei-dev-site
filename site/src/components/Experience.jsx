import PropTypes from "prop-types";

export default function Experience({ experiences }) {
  return (
    <section id="experience" className="card" aria-labelledby="experience-title">
      <h2 id="experience-title">Experience</h2>
      <div className="timeline">
        {experiences.map((item) => (
          <article key={`${item.company}-${item.period}`} className="timeline-item">
            <div className="timeline-head">
              <h3>{item.role}</h3>
              <p className="meta">{item.period}</p>
            </div>
            <p className="meta emphasis">{item.company} · {item.location}</p>
            <p className="meta body-text">{item.summary}</p>
            <ul className="bullet-list">
              {item.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
            <ul className="chips" aria-label={`${item.company} technologies`}>
              {item.technologies.map((tech) => (
                <li key={tech}>{tech}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

Experience.propTypes = {
  experiences: PropTypes.arrayOf(
    PropTypes.shape({
      company: PropTypes.string.isRequired,
      role: PropTypes.string.isRequired,
      location: PropTypes.string.isRequired,
      period: PropTypes.string.isRequired,
      summary: PropTypes.string.isRequired,
      highlights: PropTypes.arrayOf(PropTypes.string).isRequired,
      technologies: PropTypes.arrayOf(PropTypes.string).isRequired
    })
  ).isRequired
};
