import PropTypes from "prop-types";

function hasExternalLink(url) {
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

export default function Projects({ projects }) {
  return (
    <section id="projects" className="card" aria-labelledby="projects-title">
      <h2 id="projects-title">Projects</h2>
      <div className="project-grid">
        {projects.map((project) => (
          <article key={project.slug} className="project-card">
            <div className="project-header">
              <h3>{project.title}</h3>
              <span className="status-pill">{project.status}</span>
            </div>
            <p className="meta body-text">{project.summary}</p>
            <p className="meta"><strong>Problem:</strong> {project.problem}</p>
            <p className="meta"><strong>Solution:</strong> {project.solution}</p>
            <ul className="bullet-list">
              {project.outcomes.map((outcome) => (
                <li key={outcome}>{outcome}</li>
              ))}
            </ul>
            <ul className="chips" aria-label={`${project.title} technologies`}>
              {project.technologies.map((tech) => (
                <li key={tech}>{tech}</li>
              ))}
            </ul>
            <div className="project-links">
              {hasExternalLink(project.links?.demo) && (
                <a href={project.links.demo} target="_blank" rel="noopener noreferrer" className="credential-link">
                  Live Demo
                </a>
              )}
              {hasExternalLink(project.links?.repo) && (
                <a href={project.links.repo} target="_blank" rel="noopener noreferrer" className="credential-link">
                  Repository
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

Projects.propTypes = {
  projects: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      slug: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      summary: PropTypes.string.isRequired,
      problem: PropTypes.string.isRequired,
      solution: PropTypes.string.isRequired,
      outcomes: PropTypes.arrayOf(PropTypes.string).isRequired,
      technologies: PropTypes.arrayOf(PropTypes.string).isRequired,
      links: PropTypes.shape({
        demo: PropTypes.string,
        repo: PropTypes.string,
        caseStudy: PropTypes.string
      })
    })
  ).isRequired
};
