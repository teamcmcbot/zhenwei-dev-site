function handleClick() {
  globalThis.scrollTo({ top: 0, behavior: "smooth" });
}

export default function ScrollToTopButton() {
  return (
    <button
      type="button"
      className="scroll-top-btn"
      onClick={handleClick}
      aria-label="Scroll to top"
      title="Scroll to top"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="5 12 12 5 19 12" />
      </svg>
    </button>
  );
}
