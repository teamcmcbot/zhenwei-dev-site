import PropTypes from "prop-types";

export default function AwsStaticHosting({ data }) {
  return (
    <section id="aws-hosting" className="card" aria-labelledby="aws-hosting-title">
      <h2 id="aws-hosting-title">{data.title}</h2>
      <p className="meta body-text">{data.summary}</p>

      <div className="aws-grid">
        <article className="aws-panel">
          <h3>Request Flow</h3>
          <ol className="ordered-list">
            {data.requestFlow.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>

        <article className="aws-panel">
          <h3>Components</h3>
          <ul className="bullet-list">
            {data.components.map((component) => (
              <li key={component.name}>
                <strong>{component.name}:</strong> {component.purpose}
              </li>
            ))}
          </ul>
        </article>
      </div>

      <article className="aws-panel pipeline-panel">
        <h3>{data.pipelineDemo.title}</h3>
        <ol className="ordered-list">
          {data.pipelineDemo.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </article>
    </section>
  );
}

AwsStaticHosting.propTypes = {
  data: PropTypes.shape({
    title: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
    requestFlow: PropTypes.arrayOf(PropTypes.string).isRequired,
    components: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string.isRequired,
        purpose: PropTypes.string.isRequired
      })
    ).isRequired,
    pipelineDemo: PropTypes.shape({
      title: PropTypes.string.isRequired,
      steps: PropTypes.arrayOf(PropTypes.string).isRequired
    }).isRequired
  }).isRequired
};
