export const DEFAULT_VISIBLE_SKILL_COUNT = 9;

const DEFAULT_GROUP_TONE = "green";

function toSearchTerms(values = []) {
  return values
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
}

function getOrder(value, fallback) {
  return typeof value?.order === "number" ? value.order : fallback;
}

export function getSkillName(skill) {
  return typeof skill === "string" ? skill : skill.name;
}

export function normalizeSkills(skills = []) {
  return skills
    .map((group, groupIndex) => {
      const groupSearchTerms = toSearchTerms([
        group.group,
        group.badge,
        ...(group.subcategories || []),
        ...(group.aliases || [])
      ]);

      const items = (group.items || [])
        .map((item, itemIndex) => {
          const normalizedItem = typeof item === "string" ? { name: item } : item;
          const name = normalizedItem.name;

          return {
            ...normalizedItem,
            name,
            order: getOrder(normalizedItem, itemIndex + 1),
            core: Boolean(normalizedItem.core),
            subcategories: normalizedItem.subcategories || [],
            aliases: normalizedItem.aliases || [],
            searchTerms: toSearchTerms([
              name,
              ...(normalizedItem.subcategories || []),
              ...(normalizedItem.aliases || []),
              ...groupSearchTerms
            ])
          };
        })
        .sort((left, right) => left.order - right.order || left.name.localeCompare(right.name));

      return {
        ...group,
        order: getOrder(group, groupIndex + 1),
        badge: group.badge || group.group.slice(0, 3).toUpperCase(),
        tone: group.tone || DEFAULT_GROUP_TONE,
        visibleLimit: group.visibleLimit || DEFAULT_VISIBLE_SKILL_COUNT,
        subcategories: group.subcategories || [],
        aliases: group.aliases || [],
        searchTerms: groupSearchTerms,
        items
      };
    })
    .sort((left, right) => left.order - right.order || left.group.localeCompare(right.group));
}

export function skillMatchesQuery(skill, query) {
  return skill.searchTerms.some((term) => term.includes(query));
}

export function groupMatchesQuery(group, query) {
  return group.searchTerms.some((term) => term.includes(query));
}