const DATA_PATHS = {
  intro: "/data/intro.json",
  profile: "/data/profile.json",
  about: "/data/about.json",
  skills: "/data/skills.json",
  certifications: "/data/certifications.json",
  experiences: "/data/experiences.json",
  projects: "/data/projects.json",
  awsStaticHosting: "/data/aws-static-hosting.json",
  contact: "/data/contact.json"
};

async function loadJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  return response.json();
}

export async function loadHomeData() {
  const [intro, profile, about, skills, certifications, experiences, projects, awsStaticHosting, contact] = await Promise.all([
    loadJson(DATA_PATHS.intro),
    loadJson(DATA_PATHS.profile),
    loadJson(DATA_PATHS.about),
    loadJson(DATA_PATHS.skills),
    loadJson(DATA_PATHS.certifications),
    loadJson(DATA_PATHS.experiences),
    loadJson(DATA_PATHS.projects),
    loadJson(DATA_PATHS.awsStaticHosting),
    loadJson(DATA_PATHS.contact)
  ]);

  return {
    intro,
    profile,
    about,
    skills,
    certifications,
    experiences,
    projects,
    awsStaticHosting,
    contact
  };
}
