const DATA_PATHS = {
  intro: "/data/intro.json",
  skills: "/data/skills.json",
  certifications: "/data/certifications.json",
  experiences: "/data/experiences.json",
  projects: "/data/projects.json",
  awsStaticHosting: "/data/aws-static-hosting.json",
  deployment: "/data/deployment.json"
};

async function loadJson(path) {
  const response = await fetch(path);

  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status}`);
  }

  return response.json();
}

async function loadOptionalJson(path) {
  try {
    const response = await fetch(path);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to load ${path}: ${response.status}`);
    }

    return response.json();
  } catch {
    return null;
  }
}

export async function loadHomeData() {
  const [intro, skills, certifications, experiences, projects, awsStaticHosting, deployment] = await Promise.all([
    loadJson(DATA_PATHS.intro),
    loadJson(DATA_PATHS.skills),
    loadJson(DATA_PATHS.certifications),
    loadJson(DATA_PATHS.experiences),
    loadJson(DATA_PATHS.projects),
    loadJson(DATA_PATHS.awsStaticHosting),
    loadOptionalJson(DATA_PATHS.deployment)
  ]);

  return {
    intro,
    skills,
    certifications,
    experiences,
    projects,
    awsStaticHosting,
    deployment
  };
}
