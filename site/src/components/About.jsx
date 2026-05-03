import PropTypes from "prop-types";

export default function About({ about }) {
  return (
    <section id="about" className="card" aria-labelledby="about-title">
      <h2 id="about-title">{about.title || "About"}</h2>
      <div className="content-stack">
        {(about.paragraphs || []).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
      <ul className="chips" aria-label="Focus areas">
        {(about.focusAreas || []).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}

About.propTypes = {
  about: PropTypes.shape({
    title: PropTypes.string,
    paragraphs: PropTypes.arrayOf(PropTypes.string),
    focusAreas: PropTypes.arrayOf(PropTypes.string)
  }).isRequired
};
