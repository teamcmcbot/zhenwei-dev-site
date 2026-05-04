import { useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";

function isExternalLink(href) {
  if (!href || href.trim() === "" || href.trim() === "#") {
    return false;
  }

  return href.startsWith("http://") || href.startsWith("https://");
}

function normalizeCommand(value) {
  return value.trim().toLowerCase();
}

function canonicalizeCommand(value) {
  const commandAliases = {
    exp: "experience",
    certifications: "certs"
  };

  return commandAliases[value] || value;
}

function ContactIcon({ type, label }) {
  const iconKey = `${type || ""} ${label || ""}`.toLowerCase();

  if (iconKey.includes("github")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M12 2.2a10 10 0 0 0-3.16 19.49c.5.09.68-.21.68-.48v-1.7c-2.78.6-3.37-1.18-3.37-1.18-.46-1.15-1.11-1.46-1.11-1.46-.9-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.33 1.08 2.9.83.09-.64.35-1.08.63-1.33-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03A9.55 9.55 0 0 1 12 7.2c.85 0 1.7.11 2.5.34 1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.85v2.57c0 .27.18.58.69.48A10 10 0 0 0 12 2.2Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (iconKey.includes("linkedin")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M5.35 8.86H2.54v9.02h2.81V8.86ZM3.95 7.62a1.63 1.63 0 1 0 0-3.25 1.63 1.63 0 0 0 0 3.25Zm15.71 10.26v-4.95c0-2.65-1.42-3.88-3.31-3.88a2.85 2.85 0 0 0-2.58 1.42h-.04V8.86h-2.7v9.02h2.81v-4.46c0-1.18.22-2.32 1.68-2.32 1.44 0 1.46 1.35 1.46 2.39v4.39h2.68Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M3.75 5.5h16.5c.69 0 1.25.56 1.25 1.25v10.5c0 .69-.56 1.25-1.25 1.25H3.75c-.69 0-1.25-.56-1.25-1.25V6.75c0-.69.56-1.25 1.25-1.25Zm.25 2.33v8.92h16V7.83l-7.36 5.12a1.12 1.12 0 0 1-1.28 0L4 7.83Zm14.55-.83H5.45L12 11.56 18.55 7Z"
        fill="currentColor"
      />
    </svg>
  );
}

ContactIcon.propTypes = {
  type: PropTypes.string,
  label: PropTypes.string
};

function scrollToSection(sectionId) {
  const target = globalThis.document?.getElementById(sectionId);

  if (!target) {
    return;
  }

  const headerHeight = globalThis.document?.querySelector(".site-header")?.getBoundingClientRect().height || 0;
  const targetTop = target.getBoundingClientRect().top + globalThis.scrollY - headerHeight - 12;

  globalThis.scrollTo({ top: Math.max(targetTop, 0), behavior: "smooth" });
}

export default function IntroTerminal({ intro, theme, easterEggUnlocked }) {
  const [activeCommand, setActiveCommand] = useState("welcome");
  const [inputValue, setInputValue] = useState("");
  const [unknownCommand, setUnknownCommand] = useState("");
  const outputRef = useRef(null);

  const commands = intro.terminal?.commands || [];
  const commandMap = useMemo(
    () => new Map(commands.map((command) => [command.name, command])),
    [commands]
  );

  const displayImageUrl =
    easterEggUnlocked && theme === "light"
      ? intro.identity.imageUrl?.replace("-silhouette", "")
      : intro.identity.imageUrl;

  function focusOutput() {
    globalThis.setTimeout(() => {
      outputRef.current?.focus();
    }, 0);
  }

  function runCommand(commandName) {
    const normalized = normalizeCommand(commandName);
    const canonical = canonicalizeCommand(normalized);

    if (!canonical) {
      return;
    }

    if (canonical === "clear") {
      setUnknownCommand("");
      setActiveCommand("welcome");
      focusOutput();
      return;
    }

    if (canonical === "contact") {
      setUnknownCommand("");
      setActiveCommand("contact");
      focusOutput();
      return;
    }

    if (!commandMap.has(canonical)) {
      setUnknownCommand(normalized);
      setActiveCommand("unknown");
      focusOutput();
      return;
    }

    setUnknownCommand("");
    setActiveCommand(canonical);

    if (canonical === "skills" || canonical === "projects" || canonical === "experience") {
      scrollToSection(canonical);
      return;
    }

    if (canonical === "certs") {
      scrollToSection("certifications");
      return;
    }

    focusOutput();
  }

  function handleSubmit(event) {
    event.preventDefault();
    runCommand(inputValue);
    setInputValue("");
  }

  function renderWelcomeOutput() {
    return (
      <div className="terminal-output-block">
        {(intro.terminal?.welcomeLines || []).map((line) => (
          <p key={line} className="terminal-line terminal-line--success">{line}</p>
        ))}
        <p className="terminal-line">Run <span>help</span> to list commands, or inspect the panels below.</p>
      </div>
    );
  }

  function renderHelpOutput() {
    return (
      <div className="terminal-output-block">
        <p className="terminal-line terminal-line--success">Available commands</p>
        <div className="terminal-command-list">
          {commands.map((command) => (
            <button
              key={command.name}
              type="button"
              className="terminal-command-row"
              onClick={() => runCommand(command.name)}
            >
              <span>{command.label}</span>
              <small>{command.description}</small>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderAboutOutput() {
    return (
      <div className="terminal-output-block terminal-output-block--content">
        <p className="terminal-line terminal-line--accent">{intro.about.kicker}</p>
        {(intro.about.paragraphs || []).map((paragraph) => (
          <p key={paragraph} className="terminal-paragraph">{paragraph}</p>
        ))}
        <ul className="intro-tags" aria-label="Focus areas">
          {(intro.about.focusAreas || []).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    );
  }

  function renderContactOutput() {
    return (
      <div className="terminal-output-block terminal-output-block--content">
        <p className="terminal-line terminal-line--accent">{intro.contact.message}</p>
        <div className="intro-contact-actions">
          {(intro.contact.links || []).map((link) => {
            const external = isExternalLink(link.href);

            return (
              <a
                key={`${link.type}-${link.label}`}
                href={link.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
              >
                {link.label}
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  function renderJumpOutput(label) {
    return (
      <div className="terminal-output-block">
        <p className="terminal-line terminal-line--success">Opening {label}...</p>
        <p className="terminal-line">Scroll position updated. Continue down the page for the full section.</p>
      </div>
    );
  }

  function renderUnknownOutput() {
    return (
      <div className="terminal-output-block">
        <p className="terminal-line terminal-line--error">Command not found: {unknownCommand}</p>
        <p className="terminal-line">Run <span>help</span> to see available commands.</p>
      </div>
    );
  }

  function renderOutput() {
    switch (activeCommand) {
      case "help":
        return renderHelpOutput();
      case "about":
        return renderAboutOutput();
      case "contact":
        return renderContactOutput();
      case "skills":
        return renderJumpOutput("skills");
      case "certs":
        return renderJumpOutput("certifications");
      case "experience":
        return renderJumpOutput("experience");
      case "projects":
        return renderJumpOutput("projects");
      case "unknown":
        return renderUnknownOutput();
      default:
        return renderWelcomeOutput();
    }
  }

  return (
    <section id="intro" className="intro-terminal" aria-labelledby="intro-title">
      <div className="intro-shell">
        <span id="about" className="intro-anchor" aria-hidden="true" />
        <span id="contact" className="intro-anchor" aria-hidden="true" />
        <aside className="intro-profile-panel" aria-label="Profile summary">
          <div className="intro-profile-topline">
            <span>{intro.identity.domain}</span>
            <span>{intro.identity.location}</span>
          </div>
          <div className="intro-identity-row">
            {displayImageUrl && (
              <div className="intro-avatar-frame">
                <img
                  className={`intro-avatar${easterEggUnlocked && theme === "light" ? " intro-avatar--revealed" : ""}`}
                  src={displayImageUrl}
                  alt={intro.identity.name ? `${intro.identity.name} profile photo` : "Profile photo"}
                />
              </div>
            )}
            <div>
              <p className="eyebrow">{intro.identity.role}</p>
              <h1 id="intro-title">{intro.identity.headline}</h1>
            </div>
          </div>
          <p className="intro-summary">{intro.identity.summary}</p>
          <div className="intro-actions">
            <a className="btn btn-primary" href={intro.identity.primaryAction?.href || "#projects"}>
              {intro.identity.primaryAction?.label || "View Projects"}
            </a>
            <button type="button" className="btn btn-secondary" onClick={() => runCommand("contact")}>
              {intro.identity.secondaryAction?.label || "Contact"}
            </button>
          </div>
          <div className="intro-profile-contact" aria-label="Contact links">
            <p className="panel-label">Contact</p>
            <div className="intro-profile-contact-list">
              {(intro.contact.links || []).map((link) => {
                const external = isExternalLink(link.href);

                return (
                  <a
                    key={`${link.type}-${link.label}`}
                    href={link.href}
                    target={external ? "_blank" : undefined}
                    rel={external ? "noopener noreferrer" : undefined}
                  >
                    <ContactIcon type={link.type} label={link.label} />
                    <span>{link.label}</span>
                  </a>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="terminal-dashboard">
          <div className="terminal-window" aria-label="Interactive portfolio terminal">
            <div className="terminal-window-bar">
              <div className="terminal-dots" aria-hidden="true">
                <span />
                <span />
                <span />
              </div>
              <p>{intro.terminal?.title}</p>
            </div>
            <div className="terminal-body">
              <div className="terminal-output" ref={outputRef} tabIndex="-1" aria-live="polite">
                <p className="terminal-prompt"><span>{intro.terminal?.prompt}</span> {activeCommand === "welcome" ? "init" : activeCommand}</p>
                {renderOutput()}
              </div>
              <form className="terminal-input-row" onSubmit={handleSubmit}>
                <label className="sr-only" htmlFor="terminal-command">Type a portfolio command</label>
                <span aria-hidden="true">{intro.terminal?.prompt}</span>
                <input
                  id="terminal-command"
                  type="text"
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder="help"
                  autoComplete="off"
                />
              </form>
            </div>
          </div>
        </div>

        <aside className="command-rail" aria-label="Command deck">
          <p className="panel-label">Commands</p>
          <div className="command-deck">
            {commands.map((command) => (
              <button
                key={command.name}
                type="button"
                className={activeCommand === command.name ? "command-card command-card--active" : "command-card"}
                onClick={() => runCommand(command.name)}
              >
                <span>{command.label}</span>
                <small>{command.description}</small>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

IntroTerminal.propTypes = {
  theme: PropTypes.oneOf(["dark", "light"]),
  easterEggUnlocked: PropTypes.bool,
  intro: PropTypes.shape({
    identity: PropTypes.shape({
      name: PropTypes.string,
      domain: PropTypes.string,
      role: PropTypes.string,
      headline: PropTypes.string,
      summary: PropTypes.string,
      location: PropTypes.string,
      imageUrl: PropTypes.string,
      primaryAction: PropTypes.shape({
        href: PropTypes.string,
        label: PropTypes.string
      }),
      secondaryAction: PropTypes.shape({
        href: PropTypes.string,
        label: PropTypes.string
      })
    }).isRequired,
    terminal: PropTypes.shape({
      title: PropTypes.string,
      prompt: PropTypes.string,
      welcomeLines: PropTypes.arrayOf(PropTypes.string),
      commands: PropTypes.arrayOf(
        PropTypes.shape({
          name: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
          description: PropTypes.string.isRequired
        })
      )
    }).isRequired,
    about: PropTypes.shape({
      title: PropTypes.string.isRequired,
      kicker: PropTypes.string.isRequired,
      paragraphs: PropTypes.arrayOf(PropTypes.string).isRequired,
      focusAreas: PropTypes.arrayOf(PropTypes.string).isRequired
    }).isRequired,
    contact: PropTypes.shape({
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
  }).isRequired
};
