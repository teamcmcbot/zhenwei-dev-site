import PropTypes from "prop-types";

function isExternalLink(href) {
  if (!href || href.trim() === "" || href.trim() === "#") {
    return false;
  }

  return href.startsWith("http://") || href.startsWith("https://");
}

export default function Contact({ data }) {
  return (
    <section id="contact" className="card" aria-labelledby="contact-title">
      <h2 id="contact-title">{data.title}</h2>
      <p className="meta body-text">{data.message}</p>
      <div className="contact-links">
        {data.links.map((link) => {
          const external = isExternalLink(link.href);

          return (
            <a
              key={`${link.type}-${link.label}`}
              className="contact-link"
              href={link.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
            >
              {link.label}
            </a>
          );
        })}
      </div>
    </section>
  );
}

Contact.propTypes = {
  data: PropTypes.shape({
    title: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    links: PropTypes.arrayOf(
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        href: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired
      })
    ).isRequired
  }).isRequired
};
