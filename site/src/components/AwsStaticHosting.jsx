import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import ScrollToTopButton from "./ScrollToTopButton";

export default function AwsStaticHosting({ data }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dialogRef = useRef(null);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return undefined;
    }

    if (isModalOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
    }

    return undefined;
  }, [isModalOpen]);

  return (
    <section id="aws-hosting" className="card" aria-labelledby="aws-hosting-title">
      <div className="section-heading">
        <h2 id="aws-hosting-title">{data.title}</h2>
        <ScrollToTopButton />
      </div>
      <p className="meta body-text">{data.summary}</p>

      <article className="aws-panel architecture-panel">
        <h3>{data.architecture.title}</h3>
        <button
          type="button"
          className="architecture-diagram-button"
          onClick={openModal}
          aria-label={`Open full view of ${data.architecture.title}`}
        >
          <img
            src={data.architecture.diagram}
            alt="AWS Static Hosting Architecture Diagram"
            className="architecture-diagram"
          />
        </button>
      </article>

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

      <dialog
        ref={dialogRef}
        className="modal-overlay"
        aria-labelledby="aws-architecture-dialog-title"
        onClose={closeModal}
      >
        <div className="modal-content">
          <h3 id="aws-architecture-dialog-title" className="sr-only">
            {data.architecture.title}
          </h3>
          <button
            type="button"
            className="modal-close"
            onClick={closeModal}
            aria-label="Close modal"
          >
            X
          </button>
          <img
            src={data.architecture.diagram}
            alt="AWS Static Hosting Architecture Diagram - Full View"
            className="modal-image"
          />
        </div>
      </dialog>
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
    }).isRequired,
    architecture: PropTypes.shape({
      title: PropTypes.string.isRequired,
      diagram: PropTypes.string.isRequired
    }).isRequired
  }).isRequired
};
