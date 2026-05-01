import { mkdir, writeFile } from "node:fs/promises";

const USERNAME = process.env.GITHUB_USERNAME || "khalshaqzzy";
const TOKEN = process.env.GITHUB_TOKEN || "";
const API_ROOT = "https://api.github.com";

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "khalshaqzzy-profile-atlas",
  "X-GitHub-Api-Version": "2022-11-28"
};

if (TOKEN) {
  headers.Authorization = `Bearer ${TOKEN}`;
}

async function github(path) {
  const response = await fetch(`${API_ROOT}${path}`, { headers });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status} for ${path}: ${body.slice(0, 240)}`);
  }
  return response.json();
}

async function githubAll(path) {
  const items = [];
  for (let page = 1; page <= 10; page += 1) {
    const separator = path.includes("?") ? "&" : "?";
    const batch = await github(`${path}${separator}per_page=100&page=${page}`);
    items.push(...batch);
    if (batch.length < 100) break;
  }
  return items;
}

async function githubGraphql(query, variables) {
  if (!TOKEN) throw new Error("GraphQL requires GITHUB_TOKEN.");
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables })
  });
  const body = await response.json();
  if (!response.ok || body.errors) {
    throw new Error(`GitHub GraphQL failed: ${JSON.stringify(body.errors || body).slice(0, 360)}`);
  }
  return body.data;
}

function formatDateTime(value) {
  return new Date(value).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

function activityLabel(type) {
  return {
    PushEvent: "Code pushes",
    CreateEvent: "Refs created",
    PullRequestEvent: "Pull requests",
    IssuesEvent: "Issues",
    IssueCommentEvent: "Issue comments",
    PullRequestReviewEvent: "Reviews",
    PullRequestReviewCommentEvent: "Review comments",
    ForkEvent: "Forks",
    WatchEvent: "Stars",
    ReleaseEvent: "Releases"
  }[type] || type.replace(/Event$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
}

function summarizeActivity(events) {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const counts = new Map();
  for (const event of events) {
    if (new Date(event.created_at).getTime() < cutoff) continue;
    counts.set(event.type, (counts.get(event.type) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map(([type, count]) => ({ label: activityLabel(type), value: String(count) }));
}

function summarizeLanguages(languageMaps) {
  const totals = new Map();
  for (const languageMap of languageMaps) {
    for (const [language, bytes] of Object.entries(languageMap)) {
      totals.set(language, (totals.get(language) || 0) + bytes);
    }
  }
  const totalBytes = [...totals.values()].reduce((sum, bytes) => sum + bytes, 0);
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([label, bytes]) => ({
      label: label === "Jupyter Notebook" ? "Jupyter" : label,
      value: totalBytes ? Math.round((bytes / totalBytes) * 1000) / 10 : 0
    }));
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function fallbackContributions(events) {
  const today = new Date();
  const firstDay = new Date(today.getTime() - 251 * 24 * 60 * 60 * 1000);
  const counts = new Map();
  for (const event of events) {
    const key = dateKey(new Date(event.created_at));
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const levels = [];
  let total = 0;
  for (let index = 0; index < 252; index += 1) {
    const day = new Date(firstDay.getTime() + index * 24 * 60 * 60 * 1000);
    const count = counts.get(dateKey(day)) || 0;
    total += count;
    levels.push(count >= 8 ? 4 : count >= 5 ? 3 : count >= 2 ? 2 : count >= 1 ? 1 : 0);
  }
  return {
    total,
    source: "Public REST event fallback",
    levels
  };
}

async function contributionCalendar(events) {
  const now = new Date();
  const query = `
    query ProfileContributions($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                contributionLevel
              }
            }
          }
        }
      }
    }
  `;

  try {
    const result = await githubGraphql(query, {
      login: USERNAME,
      from: new Date(now.getTime() - 371 * 24 * 60 * 60 * 1000).toISOString(),
      to: now.toISOString()
    });
    const calendar = result.user.contributionsCollection.contributionCalendar;
    const levels = calendar.weeks.flatMap((week) => week.contributionDays).map((day) => {
      const level = day.contributionLevel;
      if (level === "FOURTH_QUARTILE") return 4;
      if (level === "THIRD_QUARTILE") return 3;
      if (level === "SECOND_QUARTILE") return 2;
      if (level === "FIRST_QUARTILE") return 1;
      return 0;
    });
    return {
      total: calendar.totalContributions,
      source: "GitHub GraphQL contribution calendar",
      levels: levels.slice(-252)
    };
  } catch {
    return fallbackContributions(events);
  }
}

const [user, repos, events] = await Promise.all([
  github(`/users/${USERNAME}`),
  githubAll(`/users/${USERNAME}/repos?type=owner&sort=updated&direction=desc`),
  github(`/users/${USERNAME}/events/public?per_page=100`)
]);

const publicRepos = repos.filter((repo) => !repo.private);
const languageMaps = await Promise.all(
  publicRepos.filter((repo) => repo.languages_url).map((repo) => github(repo.languages_url.replace(API_ROOT, "")))
);
const contributions = await contributionCalendar(events);

const data = {
  metrics: {
    publicRepos: user.public_repos || publicRepos.length,
    followers: user.followers || 0,
    totalStars: publicRepos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0),
    totalForks: publicRepos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0),
    contributionTotal: contributions.total,
    contributionSource: contributions.source
  },
  languages: summarizeLanguages(languageMaps),
  activity: summarizeActivity(events),
  contributionLevels: contributions.levels,
  generatedAt: formatDateTime(new Date())
};

await mkdir("data", { recursive: true });
await writeFile("data/profile-data.json", `${JSON.stringify(data, null, 2)}\n`, "utf8");
