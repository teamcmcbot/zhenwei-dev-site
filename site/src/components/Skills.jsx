import PropTypes from "prop-types";

export default function Skills({ skills }) {
  return (
    <section id="skills" className="card" aria-labelledby="skills-title">
      <h2 id="skills-title">Skills</h2>
      <div className="skills-grid">
        {skills.map((group) => (
          <article key={group.group} className="skill-group">
            <h3>{group.group}</h3>
            <ul className="chips" aria-label={`${group.group} skills`}>
              {group.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

Skills.propTypes = {
  skills: PropTypes.arrayOf(
    PropTypes.shape({
      group: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(PropTypes.string).isRequired
    })
  ).isRequired
};
