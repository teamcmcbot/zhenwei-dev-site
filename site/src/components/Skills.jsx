import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { groupMatchesQuery, normalizeSkills, skillMatchesQuery } from "../lib/skills";

export default function Skills({ skills }) {
  const [query, setQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({});
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedSkills = useMemo(() => normalizeSkills(skills), [skills]);

  const totalSkills = useMemo(
    () => normalizedSkills.reduce((total, group) => total + group.items.length, 0),
    [normalizedSkills]
  );

  const coreSkills = useMemo(
    () => normalizedSkills.flatMap((group) => group.items).filter((item) => item.core),
    [normalizedSkills]
  );

  const filteredGroups = useMemo(
    () => normalizedSkills
      .map((group) => {
        if (!normalizedQuery) {
          return group;
        }

        const groupMatches = groupMatchesQuery(group, normalizedQuery);
        const matchingItems = group.items.filter((item) => skillMatchesQuery(item, normalizedQuery));

        if (groupMatches) {
          return group;
        }

        return { ...group, items: matchingItems };
      })
      .filter((group) => group.items.length > 0),
    [normalizedQuery, normalizedSkills]
  );

  function toggleGroup(groupName) {
    setExpandedGroups((current) => ({
      ...current,
      [groupName]: !current[groupName]
    }));
  }

  return (
    <section id="skills" className="card" aria-labelledby="skills-title">
      <div className="skills-heading">
        <div>
          <p className="eyebrow">Capability Map</p>
          <h2 id="skills-title">Skills</h2>
        </div>
        <dl className="skills-summary" aria-label="Skills summary">
          <div>
            <dt>Domains</dt>
            <dd>{normalizedSkills.length}</dd>
          </div>
          <div>
            <dt>Skills</dt>
            <dd>{totalSkills}</dd>
          </div>
        </dl>
      </div>

      <div className="skills-control-panel">
        <label className="skill-search" htmlFor="skill-search">
          <span className="sr-only">Search skills</span>
          <input
            id="skill-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search skills"
          />
        </label>
        <div className="core-skills" aria-label="Core skills">
          {coreSkills.map((skill) => (
            <span key={skill.name}>{skill.name}</span>
          ))}
        </div>
      </div>

      <div className="skills-grid">
        {filteredGroups.map((group) => {
          const isExpanded = Boolean(expandedGroups[group.group]) || Boolean(normalizedQuery);
          const hasHiddenItems = group.items.length > group.visibleLimit;
          const visibleItems = isExpanded ? group.items : group.items.slice(0, group.visibleLimit);

          return (
            <article key={group.group} className={`skill-group skill-group--${group.tone}`}>
              <div className="skill-group-header">
                <span className="skill-group-badge" aria-hidden="true">{group.badge}</span>
                <div>
                  <h3>{group.group}</h3>
                  <p>{group.items.length} skills</p>
                </div>
              </div>
              <ul className="chips skill-chips" aria-label={`${group.group} skills`}>
                {visibleItems.map((item) => (
                  <li key={item.name} className={item.core ? "is-core" : undefined}>
                    {item.name}
                  </li>
                ))}
            </ul>
              {hasHiddenItems && !normalizedQuery && (
                <button
                  className="skill-toggle"
                  type="button"
                  onClick={() => toggleGroup(group.group)}
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? "Show less" : `Show ${group.items.length - group.visibleLimit} more`}
                </button>
              )}
            </article>
          );
        })}
      </div>
      {filteredGroups.length === 0 && (
        <output className="skills-empty">No skills match "{query}".</output>
      )}
    </section>
  );
}

Skills.propTypes = {
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
  ).isRequired
};
