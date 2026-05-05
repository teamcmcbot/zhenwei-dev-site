import PropTypes from "prop-types";

Footer.propTypes = {
  name: PropTypes.string
};

export default function Footer({ name }) {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <p className="footer-copy">
        &copy; {year} {name} &mdash; Built with React + Vite, hosted on AWS S3 &amp; CloudFront.
      </p>
      <a href="#top" className="footer-back-to-top" aria-label="Back to top">
        &uarr; Top
      </a>
    </footer>
  );
}
