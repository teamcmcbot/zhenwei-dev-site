import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { getSkillName, normalizeSkills } from "../lib/skills";

function isExternalLink(href) {
  if (!href || href.trim() === "" || href.trim() === "#") {
    return false;
  }

  return href.startsWith("http://") || href.startsWith("https://");
}

function normalizeCommand(value) {
  return value.trim().toLowerCase();
}

function getResumeMode() {
  const appEnv = (import.meta.env.VITE_APP_ENV || "").trim().toLowerCase();
  const explicitMode = (import.meta.env.VITE_RESUME_MODE || "").trim().toLowerCase();

  if (explicitMode === "api" || explicitMode === "local-static") {
    return explicitMode;
  }

  return appEnv === "prod" ? "api" : "local-static";
}

function getResumeApiConfig() {
  const expiry = Number.parseInt(import.meta.env.VITE_RESUME_EXPIRY_SECONDS || "300", 10);

  return {
    apiUrl: import.meta.env.VITE_RESUME_API_URL || "https://api.zhenwei.dev/get-presigned-url",
    objectKey: import.meta.env.VITE_RESUME_OBJECT_KEY || "private-downloads/resume/zhenwei-seo-cv.pdf",
    expirySeconds: Number.isFinite(expiry) ? expiry : 300
  };
}

function canonicalizeCommand(value) {
  const commandAliases = {
    exp: "experience",
    certifications: "certs",
    "get resume": "resume"
  };

  return commandAliases[value] || value;
}

function getPreviewItems(items = [], limit = 3) {
  return {
    visible: items.slice(0, limit),
    remaining: Math.max(items.length - limit, 0)
  };
}

function getDisplayHref(href = "") {
  return href.startsWith("mailto:") ? href.slice("mailto:".length) : href;
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

  if (iconKey.includes("credly")) {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
        <path
          d="M12 2 4 6.5v11L12 22l8-4.5v-11L12 2Zm0 2.3 5.8 3.25v6.9L12 17.7l-5.8-3.25V7.55L12 4.3ZM10.05 14.3l-2.1-2.1 1.06-1.06.9.9 3.08-3.5 1.1.97-4.04 4.59Z"
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

function formatDeployTime(value) {
  if (!value) {
    return "Local preview";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const parts = new Intl.DateTimeFormat("en-SG", {
    timeZone: "Asia/Singapore",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }).formatToParts(date);

  const dateParts = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value])
  );

  return `${dateParts.day} ${dateParts.month} ${dateParts.year} ${dateParts.hour}:${dateParts.minute} ${dateParts.dayPeriod.toUpperCase()}`;
}

function getShortSha(deployment) {
  return deployment?.shortSha || deployment?.sha?.slice(0, 7) || "";
}

function formatProgressBar(progress) {
  const total = 19;
  const bounded = Math.max(1, Math.min(progress, 100));
  const filled = Math.floor((bounded / 100) * total);

  if (filled >= total) {
    return `${"=".repeat(total - 1)}>`;
  }

  return `${"=".repeat(Math.max(filled - 1, 0))}>${" ".repeat(total - filled)}`;
}

function triggerBrowserDownload(url, fileName) {
  if (!url) {
    return;
  }

  const anchor = globalThis.document?.createElement("a");

  if (!anchor) {
    return;
  }

  anchor.href = url;

  if (fileName) {
    anchor.download = fileName;
  }

  anchor.style.display = "none";
  globalThis.document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

export default function IntroTerminal({ intro, theme, deployment, easterEggUnlocked, onHide, onUnhide, skills, certifications, experiences, projects }) {
  const [activeCommand, setActiveCommand] = useState("welcome");
  const [inputValue, setInputValue] = useState("");
  const [unknownCommand, setUnknownCommand] = useState("");
  const [outputHighlighted, setOutputHighlighted] = useState(false);
  const [copiedKey, setCopiedKey] = useState("");
  const [resumeState, setResumeState] = useState("idle");
  const [resumeError, setResumeError] = useState("");
  const [resumeUsedFallback, setResumeUsedFallback] = useState(false);
  const [resumeProgress, setResumeProgress] = useState(0);
  const [resumeMetadata, setResumeMetadata] = useState(null);
  const resumeAction = intro.identity.resumeAction;
  const resumeHref = resumeAction?.href || "";
  const resumeExternal = isExternalLink(resumeHref);
  const resumeDownload = resumeAction?.download !== false && !resumeExternal;
  const resumeFileName = resumeAction?.fileName;
  const resumeMode = getResumeMode();
  const outputRef = useRef(null);
  const inputRef = useRef(null);
  const attentionTimeoutRef = useRef(null);
  const resumeDoneTimeoutRef = useRef(null);
  const resumeProgressIntervalRef = useRef(null);
  const resumeFallbackTimeoutRef = useRef(null);

  const commands = intro.terminal?.commands || [];
  const commandMap = useMemo(
    () => new Map(commands.map((command) => [command.name, command])),
    [commands]
  );

  const displayImageUrl =
    easterEggUnlocked
      ? intro.identity.imageUrl?.replace("-silhouette", "")
      : intro.identity.imageUrl;

  useEffect(() => () => {
    globalThis.clearTimeout(attentionTimeoutRef.current);
    globalThis.clearTimeout(resumeDoneTimeoutRef.current);
    globalThis.clearInterval(resumeProgressIntervalRef.current);
    globalThis.clearTimeout(resumeFallbackTimeoutRef.current);
  }, []);

  function clearResumeTimers() {
    globalThis.clearTimeout(resumeDoneTimeoutRef.current);
    globalThis.clearInterval(resumeProgressIntervalRef.current);
    globalThis.clearTimeout(resumeFallbackTimeoutRef.current);
  }

  function beginResumeProgressAnimation(onComplete) {
    const durationMs = 1000;
    const start = Date.now();

    clearResumeTimers();
    setResumeProgress(1);

    resumeProgressIntervalRef.current = globalThis.setInterval(() => {
      const elapsed = Date.now() - start;
      const next = Math.max(1, Math.min(100, Math.round((elapsed / durationMs) * 100)));

      setResumeProgress(next);

      if (elapsed >= durationMs) {
        clearResumeTimers();
        setResumeProgress(100);
        onComplete?.();
        setResumeState("done");
      }
    }, 50);
  }

  async function requestResumeDownload() {
    if (resumeState === "requesting" || resumeState === "downloading") {
      return;
    }

    clearResumeTimers();
    setResumeError("");
    setResumeUsedFallback(false);
    setResumeProgress(0);
    setResumeMetadata(null);
    setResumeState("requesting");

    if (resumeMode === "local-static") {
      if (!resumeHref) {
        setResumeError("No local resume file configured.");
        setResumeState("error");
        return;
      }

      setResumeState("downloading");
      beginResumeProgressAnimation(() => {
        triggerBrowserDownload(resumeHref, resumeFileName || undefined);
      });
      return;
    }

    const { apiUrl, objectKey, expirySeconds } = getResumeApiConfig();

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          objectKey,
          expirySeconds
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const payload = await response.json();
      const downloadUrl = payload?.url;

      if (!downloadUrl) {
        throw new Error("API response missing url");
      }

      setResumeMetadata({
        fileName: payload?.fileName,
        eTag: payload?.eTag,
        lastModified: payload?.lastModified,
        contentLength: payload?.contentLength,
        contentType: payload?.contentType,
        versionId: payload?.versionId
      });

      setResumeState("downloading");
      beginResumeProgressAnimation(() => {
        triggerBrowserDownload(downloadUrl, payload?.fileName || resumeFileName || undefined);
      });
    } catch (error) {
      clearResumeTimers();
      const message = error instanceof Error ? error.message : "Could not reach download API.";
      setResumeError(message);
      setResumeUsedFallback(true);
      setResumeState("error");

      if (resumeHref) {
        resumeFallbackTimeoutRef.current = globalThis.setTimeout(() => {
          setResumeState("downloading");
          beginResumeProgressAnimation(() => {
            triggerBrowserDownload(resumeHref, resumeFileName || undefined);
          });
        }, 300);
      }
    }
  }

  async function copyToClipboard(text, key) {
    try {
      await globalThis.navigator?.clipboard?.writeText(text);
      setCopiedKey(key);
      globalThis.setTimeout(() => {
        setCopiedKey((current) => (current === key ? "" : current));
      }, 1200);
    } catch {
      setCopiedKey("");
    }
  }

  function refocusTerminalInput() {
    globalThis.clearTimeout(attentionTimeoutRef.current);
    setOutputHighlighted(true);

    attentionTimeoutRef.current = globalThis.setTimeout(() => {
      setOutputHighlighted(false);
    }, 900);

    globalThis.setTimeout(() => {
      inputRef.current?.focus();
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
      refocusTerminalInput();
      return;
    }

    if (canonical === "contact") {
      setUnknownCommand("");
      setActiveCommand("contact");
      refocusTerminalInput();
      return;
    }

    if (canonical === "hide") {
      setUnknownCommand("");
      setActiveCommand("hide");
      onHide?.();
      refocusTerminalInput();
      return;
    }

    if (canonical === "unhide") {
      setUnknownCommand("");
      setActiveCommand("unhide");
      onUnhide?.();
      refocusTerminalInput();
      return;
    }

    if (canonical === "email" || canonical === "credly" || canonical === "github" || canonical === "linkedin") {
      setUnknownCommand("");
      setActiveCommand(canonical);
      refocusTerminalInput();
      return;
    }

    if (canonical === "infra" || canonical === "architecture") {
      setUnknownCommand("");
      setActiveCommand("infra");
      scrollToSection("aws-hosting");
      refocusTerminalInput();
      return;
    }

    if (canonical === "resume") {
      setUnknownCommand("");
      setActiveCommand("resume");
      requestResumeDownload();
      refocusTerminalInput();
      return;
    }

    if (!commandMap.has(canonical)) {
      setUnknownCommand(normalized);
      setActiveCommand("unknown");
      refocusTerminalInput();
      return;
    }

    setUnknownCommand("");
    setActiveCommand(canonical);
    refocusTerminalInput();
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
        <p className="terminal-line">Run <span>help</span> to list commands, or inspect the panels to the right.</p>
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
            const displayHref = getDisplayHref(link.href);
            const copyKey = `contact-${link.label.toLowerCase()}`;

            return (
              <div key={`${link.type}-${link.label}`} className="terminal-contact-row">
                <p className="terminal-line">
                  <span className="terminal-line--success">{link.label}:</span> {displayHref}
                </p>
                <button
                  type="button"
                  className="terminal-copy-button"
                  onClick={() => copyToClipboard(displayHref, copyKey)}
                  aria-label={`Copy ${link.label}`}
                  title="Copy"
                >
                  {copiedKey === copyKey ? "Copied" : "Copy"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function renderBuildMetadata() {
    const formattedDeployTime = formatDeployTime(deployment?.deployedAt);
    const shortSha = getShortSha(deployment);
    const commitUrl = deployment?.commitUrl;

    return (
      <div className="intro-build-metadata" aria-label="Build metadata">
        <p>
          <span>Last Build:</span>{" "}
          {deployment?.runUrl ? (
            <a href={deployment.runUrl} target="_blank" rel="noopener noreferrer">
              <time dateTime={deployment?.deployedAt || undefined}>{formattedDeployTime}</time>
            </a>
          ) : (
            <time dateTime={deployment?.deployedAt || undefined}>{formattedDeployTime}</time>
          )}
          {shortSha && (
            <>
              {" ("}
              {commitUrl ? (
                <a href={commitUrl} target="_blank" rel="noopener noreferrer">
                  {shortSha}
                </a>
              ) : (
                shortSha
              )}
              )
            </>
          )}
        </p>
      </div>
    );
  }

  function renderSeeMore(sectionId, label) {
    return (
      <div className="terminal-action-row">
        <button type="button" className="terminal-see-more" onClick={() => scrollToSection(sectionId)}>
          See more in {label}
        </button>
      </div>
    );
  }

  function renderRemainderChip(count) {
    if (count <= 0) {
      return null;
    }

    return <li className="terminal-preview-chip terminal-preview-chip--more">+{count} more</li>;
  }

  function renderPreviewChips(items, limit, ariaLabel) {
    const { visible, remaining } = getPreviewItems(items, limit);

    return (
      <ul className="terminal-preview-chips" aria-label={ariaLabel}>
        {visible.map((item) => (
          <li key={getSkillName(item)} className="terminal-preview-chip">{getSkillName(item)}</li>
        ))}
        {renderRemainderChip(remaining)}
      </ul>
    );
  }

  function renderSkillsOutput() {
    const normalizedSkills = normalizeSkills(skills);
    const totalSkills = normalizedSkills.reduce((total, group) => total + group.items.length, 0);

    return (
      <div className="terminal-output-block terminal-output-block--content">
        <p className="terminal-line terminal-line--success">Skills index: {normalizedSkills.length} groups / {totalSkills} skills</p>
        <div className="terminal-record-list">
          {normalizedSkills.map((group) => (
            <article key={group.group} className="terminal-record terminal-record--compact">
              <h3>{group.group}</h3>
              {renderPreviewChips(group.items, 5, `${group.group} skill preview`)}
            </article>
          ))}
        </div>
        {renderSeeMore("skills", "Skills")}
      </div>
    );
  }

  function renderCertificationsOutput() {
    return (
      <div className="terminal-output-block terminal-output-block--content">
        <p className="terminal-line terminal-line--success">Certification registry: {certifications.length} credentials</p>
        <div className="terminal-record-list">
          {certifications.map((certification) => {
            const hasCredentialLink = isExternalLink(certification.credentialUrl);
            const hasBadgeImage = Boolean(certification.badgeImage);

            return (
              <article key={certification.name} className="terminal-record terminal-cert-record">
                <div className="terminal-cert-content">
                  <h3>{certification.name}</h3>
                  <p className="terminal-meta">{certification.issuer}</p>
                  <p className="terminal-meta">Issued {certification.issuedDate} / Expires {certification.expirationDate}</p>
                  {hasCredentialLink && (
                    <a className="terminal-inline-link" href={certification.credentialUrl} target="_blank" rel="noopener noreferrer">
                      View credential
                    </a>
                  )}
                </div>
                {hasBadgeImage &&
                  (hasCredentialLink ? (
                    <a
                      className="terminal-cert-badge-link"
                      href={certification.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open credential for ${certification.name}`}
                    >
                      <img className="terminal-cert-badge" src={certification.badgeImage} alt={`${certification.name} badge`} loading="lazy" />
                    </a>
                  ) : (
                    <img className="terminal-cert-badge" src={certification.badgeImage} alt={`${certification.name} badge`} loading="lazy" />
                  ))}
              </article>
            );
          })}
        </div>
        {renderSeeMore("certifications", "Certifications")}
      </div>
    );
  }

  function renderExperienceOutput() {
    return (
      <div className="terminal-output-block terminal-output-block--content">
        <p className="terminal-line terminal-line--success">Experience timeline: {experiences.length} roles</p>
        <div className="terminal-record-list">
          {experiences.map((item) => {
            const { visible: highlights, remaining } = getPreviewItems(item.highlights, 2);

            return (
              <article key={`${item.company}-${item.period}`} className="terminal-record">
                <div className="terminal-record-head">
                  <h3>{item.role}</h3>
                  <span>{item.period}</span>
                </div>
                <p className="terminal-meta">{item.company} / {item.location}</p>
                <p className="terminal-paragraph">{item.summary}</p>
                <ul className="terminal-bullet-list">
                  {highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                  {remaining > 0 && <li className="terminal-muted">+{remaining} more highlights</li>}
                </ul>
                {renderPreviewChips(item.technologies, 5, `${item.company} technology preview`)}
              </article>
            );
          })}
        </div>
        {renderSeeMore("experience", "Experience")}
      </div>
    );
  }

  function renderProjectsOutput() {
    return (
      <div className="terminal-output-block terminal-output-block--content">
        <p className="terminal-line terminal-line--success">Project evidence: {projects.length} builds</p>
        <div className="terminal-record-list">
          {projects.map((project) => {
            const { visible: outcomes, remaining } = getPreviewItems(project.outcomes, 2);
            const hasDemoLink = isExternalLink(project.links?.demo);
            const hasRepoLink = isExternalLink(project.links?.repo);

            return (
              <article key={project.slug} className="terminal-record">
                <div className="terminal-record-head">
                  <h3>{project.title}</h3>
                  <span>{project.status}</span>
                </div>
                <p className="terminal-paragraph">{project.summary}</p>
                <ul className="terminal-bullet-list">
                  {outcomes.map((outcome) => (
                    <li key={outcome}>{outcome}</li>
                  ))}
                  {remaining > 0 && <li className="terminal-muted">+{remaining} more outcomes</li>}
                </ul>
                {renderPreviewChips(project.technologies, 5, `${project.title} technology preview`)}
                {(hasDemoLink || hasRepoLink) && (
                  <div className="terminal-link-row">
                    {hasDemoLink && (
                      <a className="terminal-inline-link" href={project.links.demo} target="_blank" rel="noopener noreferrer">
                        Live demo
                      </a>
                    )}
                    {hasRepoLink && (
                      <a className="terminal-inline-link" href={project.links.repo} target="_blank" rel="noopener noreferrer">
                        Repository
                      </a>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
        {renderSeeMore("projects", "Projects")}
      </div>
    );
  }

  function findContactLink(label) {
    return (intro.contact.links || []).find(
      (link) => link.label?.toLowerCase() === label.toLowerCase()
    );
  }

  function renderContactLinkOutput(label) {
    const link = findContactLink(label);

    if (!link) {
      return (
        <div className="terminal-output-block">
          <p className="terminal-line terminal-line--error">{label.charAt(0).toUpperCase() + label.slice(1)} URL not found.</p>
        </div>
      );
    }

    const displayHref = getDisplayHref(link.href);
    const copyKey = `single-${label.toLowerCase()}`;

    return (
      <div className="terminal-output-block">
        <p className="terminal-line terminal-line--success">{link.label}</p>
        <div className="terminal-contact-row">
          <p className="terminal-line">{displayHref}</p>
          <button
            type="button"
            className="terminal-copy-button"
            onClick={() => copyToClipboard(displayHref, copyKey)}
            aria-label={`Copy ${link.label}`}
            title="Copy"
          >
            {copiedKey === copyKey ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    );
  }

  function renderInfraOutput() {
    return (
      <div className="terminal-output-block">
        <p className="terminal-line terminal-line--success">Navigating to site infrastructure section...</p>
      </div>
    );
  }

  function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return "0 B";
    const units = ["B", "KB", "MB", "GB"];
    const size = Math.abs(bytes);
    let unitIndex = 0;
    let value = size;

    while (value >= 1024 && unitIndex < units.length - 1) {
      value /= 1024;
      unitIndex += 1;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}`;
  }

  function formatMetadataDate(dateString) {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-SG", {
        timeZone: "Asia/Singapore",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true
      }).format(date);
    } catch {
      return dateString;
    }
  }

  function renderResumeOutput() {
    const isFallbackDownload = resumeUsedFallback && resumeHref && (resumeState === "downloading" || resumeState === "done");
    let secondaryResumeLine = "Using local static resume fallback...";

    if (!isFallbackDownload && resumeMode === "api") {
      secondaryResumeLine = "Connecting to resume API...";
    }

    return (
      <div className="terminal-output-block">
        {resumeError && (
          <p className="terminal-line terminal-line--error">Error: {resumeError}</p>
        )}

        {resumeUsedFallback && resumeHref && (
          <p className="terminal-line terminal-line--muted">Falling back to local resume download...</p>
        )}

        {resumeState === "error" && !resumeHref && !resumeUsedFallback && (
          <p className="terminal-line terminal-line--muted">No local fallback is configured.</p>
        )}

        {(resumeState === "requesting" || resumeState === "downloading" || resumeState === "done") && (
          <>
            <p className="terminal-line terminal-line--muted">Requesting presigned URL...</p>
            <p className="terminal-line terminal-line--muted">{secondaryResumeLine}</p>
          </>
        )}

        {(resumeState === "downloading" || resumeState === "done") && (
          <>
            <pre className="terminal-wget-block">
{`HTTP request sent, awaiting response... 200 OK
Saving to: '${resumeFileName || "zhenwei-seo-cv.pdf"}'

${resumeFileName || "zhenwei-seo-cv.pdf"} ${String(resumeProgress || 1).padStart(3, " ")}%[${formatProgressBar(resumeProgress || 1)}] ${resumeProgress >= 100 ? "done" : "..."}`}
            </pre>

            {resumeState === "done" && resumeMetadata && (
              <div className="terminal-metadata-block">
                <p className="terminal-line terminal-line--success">File metadata:</p>
                <ul className="terminal-metadata-list">
                  {resumeMetadata.fileName && (
                    <li className="terminal-metadata-item">
                      <span className="metadata-label">File:</span>
                      <span className="metadata-value">{resumeMetadata.fileName}</span>
                    </li>
                  )}
                  {resumeMetadata.contentLength && (
                    <li className="terminal-metadata-item">
                      <span className="metadata-label">Size:</span>
                      <span className="metadata-value">{formatFileSize(resumeMetadata.contentLength)}</span>
                    </li>
                  )}
                  {resumeMetadata.contentType && (
                    <li className="terminal-metadata-item">
                      <span className="metadata-label">Type:</span>
                      <span className="metadata-value">{resumeMetadata.contentType}</span>
                    </li>
                  )}
                  {resumeMetadata.lastModified && (
                    <li className="terminal-metadata-item">
                      <span className="metadata-label">Modified:</span>
                      <span className="metadata-value">{formatMetadataDate(resumeMetadata.lastModified)}</span>
                    </li>
                  )}
                  {resumeMetadata.eTag && (
                    <li className="terminal-metadata-item">
                      <span className="metadata-label">ETag:</span>
                      <span className="metadata-value" title="Checksum for integrity verification">{resumeMetadata.eTag}</span>
                    </li>
                  )}
                  {resumeMetadata.versionId && (
                    <li className="terminal-metadata-item">
                      <span className="metadata-label">Version:</span>
                      <span className="metadata-value">{resumeMetadata.versionId}</span>
                    </li>
                  )}
                </ul>
              </div>
            )}

            {resumeState === "done" && (
              <p className="terminal-line terminal-line--success">Download complete. Check your downloads folder.</p>
            )}
          </>
        )}
      </div>
    );
  }

  function renderHideOutput() {
    return (
      <div className="terminal-output-block">
        <p className="terminal-line terminal-line--success">Profile hidden. Identity concealed.</p>
      </div>
    );
  }

  function renderUnhideOutput() {
    return (
      <div className="terminal-output-block">
        <p className="terminal-line terminal-line--success">Identity revealed.</p>
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
        return renderSkillsOutput();
      case "certs":
        return renderCertificationsOutput();
      case "experience":
        return renderExperienceOutput();
      case "projects":
        return renderProjectsOutput();
      case "hide":
        return renderHideOutput();
      case "unhide":
        return renderUnhideOutput();
      case "email":
        return renderContactLinkOutput("email");
      case "credly":
        return renderContactLinkOutput("credly");
      case "github":
        return renderContactLinkOutput("github");
      case "linkedin":
        return renderContactLinkOutput("linkedin");
      case "infra":
        return renderInfraOutput();
      case "resume":
        return renderResumeOutput();
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
          <div className="intro-identity-name-row">
            {displayImageUrl && (
              <div className="intro-avatar-frame">
                <img
                  className={`intro-avatar${easterEggUnlocked ? " intro-avatar--revealed" : ""}`}
                  src={displayImageUrl}
                  alt={intro.identity.name ? `${intro.identity.name} profile photo` : "Profile photo"}
                />
              </div>
            )}
            <div className="intro-identity-name-col">
              <p className="eyebrow">{intro.identity.role}</p>
              <h1 id="intro-title">{intro.identity.headline}</h1>
            </div>
          </div>
          <p className="intro-summary">{intro.identity.summary}</p>
          <div className="intro-actions">
            <a
              className="btn btn-primary"
              href={resumeHref}
              download={resumeDownload && resumeMode === "local-static" ? resumeFileName || true : undefined}
              target={resumeExternal && resumeMode === "local-static" ? "_blank" : undefined}
              rel={resumeExternal && resumeMode === "local-static" ? "noopener noreferrer" : undefined}
              onClick={(event) => {
                event.preventDefault();
                runCommand("resume");
              }}
            >
              {resumeAction?.label || "Download CV"}
            </a>
          </div>
          {renderBuildMetadata()}
          <div className="intro-profile-contact" aria-label="Contact links">
            <p className="panel-label">Contact & Links</p>
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
              <div
                className={outputHighlighted ? "terminal-output terminal-output--attention" : "terminal-output"}
                ref={outputRef}
                tabIndex="-1"
                aria-live="polite"
              >
                <p className="terminal-prompt"><span>{intro.terminal?.prompt}</span> {activeCommand === "welcome" ? "init" : activeCommand}</p>
                {renderOutput()}
              </div>
              <form className="terminal-input-row" onSubmit={handleSubmit}>
                <label className="sr-only" htmlFor="terminal-command">Type a portfolio command</label>
                <span aria-hidden="true">{intro.terminal?.prompt}</span>
                <input
                  id="terminal-command"
                  ref={inputRef}
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
  deployment: PropTypes.shape({
    deployedAt: PropTypes.string,
    runUrl: PropTypes.string,
    sha: PropTypes.string,
    shortSha: PropTypes.string,
    commitUrl: PropTypes.string
  }),
  easterEggUnlocked: PropTypes.bool,
  onHide: PropTypes.func,
  onUnhide: PropTypes.func,
  skills: PropTypes.arrayOf(
    PropTypes.shape({
      group: PropTypes.string.isRequired,
      order: PropTypes.number,
      badge: PropTypes.string,
      tone: PropTypes.string,
      visibleLimit: PropTypes.number,
      subcategories: PropTypes.arrayOf(PropTypes.string),
      aliases: PropTypes.arrayOf(PropTypes.string),
      items: PropTypes.arrayOf(
        PropTypes.oneOfType([
          PropTypes.string,
          PropTypes.shape({
            name: PropTypes.string.isRequired,
            order: PropTypes.number,
            core: PropTypes.bool,
            subcategories: PropTypes.arrayOf(PropTypes.string),
            aliases: PropTypes.arrayOf(PropTypes.string)
          })
        ])
      ).isRequired
    })
  ).isRequired,
  certifications: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      issuer: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      issuedDate: PropTypes.string.isRequired,
      expirationDate: PropTypes.string.isRequired,
      credentialUrl: PropTypes.string,
      badgeImage: PropTypes.string
    })
  ).isRequired,
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
  ).isRequired,
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
  ).isRequired,
  intro: PropTypes.shape({
    identity: PropTypes.shape({
      name: PropTypes.string,
      domain: PropTypes.string,
      role: PropTypes.string,
      headline: PropTypes.string,
      summary: PropTypes.string,
      location: PropTypes.string,
      imageUrl: PropTypes.string,
      resumeAction: PropTypes.shape({
        href: PropTypes.string,
        label: PropTypes.string,
        download: PropTypes.bool,
        fileName: PropTypes.string
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
