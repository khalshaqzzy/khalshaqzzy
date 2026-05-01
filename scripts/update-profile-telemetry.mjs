import { readFile, writeFile, mkdir } from "node:fs/promises";

const USERNAME = process.env.GITHUB_USERNAME || "khalshaqzzy";
const TOKEN = process.env.GITHUB_TOKEN || "";
const API_ROOT = "https://api.github.com";
const README_PATH = "README.md";
const TELEMETRY_SVG_PATH = "assets/github-telemetry.svg";
const CONTRIBUTION_TILES_SVG_PATH = "assets/contribution-tiles.svg";
const START = "<!-- GITHUB_TELEMETRY:START -->";
const END = "<!-- GITHUB_TELEMETRY:END -->";

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "khalshaqzzy-profile-telemetry",
  "X-GitHub-Api-Version": "2022-11-28",
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
  if (!TOKEN) {
    throw new Error("GraphQL contribution calendar requires GITHUB_TOKEN.");
  }
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();
  if (!response.ok || body.errors) {
    throw new Error(`GitHub GraphQL failed: ${JSON.stringify(body.errors || body).slice(0, 360)}`);
  }
  return body.data;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatDate(value) {
  if (!value) return "No public signal";
  const date = new Date(value);
  return date.toISOString().slice(0, 10);
}

function formatDateTime(value) {
  const date = new Date(value);
  return date.toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

function compactNumber(value) {
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);
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
    ReleaseEvent: "Releases",
  }[type] || type.replace(/Event$/, "").replace(/([a-z])([A-Z])/g, "$1 $2");
}

function summarizeActivity(events) {
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = events.filter((event) => new Date(event.created_at).getTime() >= cutoff);
  const counts = new Map();
  for (const event of recent) {
    counts.set(event.type, (counts.get(event.type) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 4)
    .map(([type, count]) => `${activityLabel(type)}: ${count}`);
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
    .slice(0, 6)
    .map(([language, bytes]) => ({
      language,
      bytes,
      percent: totalBytes ? Math.round((bytes / totalBytes) * 1000) / 10 : 0,
    }));
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function fetchContributionCalendar(events) {
  const now = new Date();
  const to = now.toISOString();
  const from = new Date(now.getTime() - 371 * 24 * 60 * 60 * 1000).toISOString();
  const query = `
    query ProfileContributions($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
                weekday
              }
            }
          }
        }
      }
    }
  `;

  try {
    const result = await githubGraphql(query, { login: USERNAME, from, to });
    const calendar = result.user.contributionsCollection.contributionCalendar;
    return {
      source: "GitHub GraphQL contribution calendar",
      total: calendar.totalContributions,
      weeks: calendar.weeks.map((week) => ({
        contributionDays: week.contributionDays.map((day) => ({
          date: day.date,
          count: day.contributionCount,
          level: Number(day.contributionLevel.replace("FOURTH_QUARTILE", 4)
            .replace("THIRD_QUARTILE", 3)
            .replace("SECOND_QUARTILE", 2)
            .replace("FIRST_QUARTILE", 1)
            .replace("NONE", 0)),
          weekday: day.weekday,
        })),
      })),
    };
  } catch {
    return buildFallbackContributionCalendar(events);
  }
}

function buildFallbackContributionCalendar(events) {
  const today = startOfUtcDay(new Date());
  const firstDay = new Date(today.getTime() - 52 * 7 * 24 * 60 * 60 * 1000);
  const counts = new Map();
  for (const event of events) {
    const key = dateKey(new Date(event.created_at));
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  const weeks = [];
  let total = 0;
  for (let week = 0; week < 53; week += 1) {
    const contributionDays = [];
    for (let weekday = 0; weekday < 7; weekday += 1) {
      const day = new Date(firstDay.getTime() + (week * 7 + weekday) * 24 * 60 * 60 * 1000);
      const count = counts.get(dateKey(day)) || 0;
      total += count;
      const level = count >= 8 ? 4 : count >= 5 ? 3 : count >= 2 ? 2 : count >= 1 ? 1 : 0;
      contributionDays.push({ date: dateKey(day), count, level, weekday });
    }
    weeks.push({ contributionDays });
  }

  return {
    source: "Public REST event fallback",
    total,
    weeks,
  };
}

function buildContributionTilesSvg(calendar) {
  const colors = ["#111821", "#164150", "#1D6B7B", "#36A3B5", "#F6C56F"];
  const tiles = calendar.weeks
    .map((week, weekIndex) => week.contributionDays.map((day) => {
      const x = 70 + weekIndex * 21;
      const y = 92 + day.weekday * 21;
      const height = 6 + day.level * 4;
      return `<g>
        <rect x="${x}" y="${y}" width="15" height="15" rx="3" fill="${colors[day.level]}" stroke="#E6EDF3" stroke-opacity="0.06"/>
        <path d="M${x} ${y + 15}L${x + 4} ${y + 20}H${x + 19}L${x + 15} ${y + 15}Z" fill="${colors[day.level]}" opacity="0.42"/>
        <rect x="${x}" y="${y - height + 15}" width="15" height="${height}" rx="3" fill="${colors[day.level]}" opacity="${day.level ? "0.92" : "0.52"}">
          <title>${escapeXml(day.date)}: ${day.count} contributions</title>
        </rect>
      </g>`;
    }).join(""))
    .join("");

  return `<svg width="1400" height="360" viewBox="0 0 1400 360" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">Contribution Tiles for ${escapeXml(USERNAME)}</title>
  <desc id="desc">A generated contribution tile field for ${escapeXml(USERNAME)} refreshed from GitHub data.</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1400" y2="360" gradientUnits="userSpaceOnUse">
      <stop stop-color="#080B10"/>
      <stop offset="1" stop-color="#111821"/>
    </linearGradient>
    <pattern id="grid" width="42" height="42" patternUnits="userSpaceOnUse">
      <path d="M42 0H0V42" stroke="#E6EDF3" stroke-opacity="0.028"/>
    </pattern>
  </defs>
  <rect width="1400" height="360" rx="10" fill="url(#bg)"/>
  <rect width="1400" height="360" rx="10" fill="url(#grid)"/>
  <rect x="42" y="42" width="1316" height="276" rx="8" stroke="#E6EDF3" stroke-opacity="0.12"/>
  <text x="70" y="72" fill="#7DD3FC" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12" letter-spacing="3">CONTRIBUTION TILE FIELD / LAST 12 MONTHS</text>
  ${tiles}
  <g transform="translate(1192 86)">
    <rect x="0" y="0" width="118" height="146" rx="8" fill="#0B1017" stroke="#E6EDF3" stroke-opacity="0.12"/>
    <text x="18" y="35" fill="#F6C56F" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" letter-spacing="2">TOTAL</text>
    <text x="18" y="87" fill="#F8FAFC" font-family="Segoe UI, ui-sans-serif, system-ui, sans-serif" font-size="40" font-weight="650">${escapeXml(compactNumber(calendar.total))}</text>
    <text x="18" y="116" fill="#93A4B7" font-family="Segoe UI, ui-sans-serif, system-ui, sans-serif" font-size="13">contributions</text>
  </g>
  <g transform="translate(1192 258)">
    <rect x="0" y="0" width="16" height="16" rx="3" fill="#111821"/>
    <rect x="24" y="0" width="16" height="16" rx="3" fill="#164150"/>
    <rect x="48" y="0" width="16" height="16" rx="3" fill="#1D6B7B"/>
    <rect x="72" y="0" width="16" height="16" rx="3" fill="#36A3B5"/>
    <rect x="96" y="0" width="16" height="16" rx="3" fill="#F6C56F"/>
  </g>
  <text x="70" y="296" fill="#58677A" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11">SOURCE ${escapeXml(calendar.source.toUpperCase())} / PRIVATE CONTRIBUTION DETAILS MAY BE RESTRICTED BY GITHUB SETTINGS</text>
</svg>`;
}

function buildSvg(data) {
  const languageRows = data.languages.length
    ? data.languages.slice(0, 5)
    : [{ language: "Public language data", percent: 0, bytes: 0 }];
  const activityRows = data.activity.length ? data.activity : ["No public events in the last 30 days"];
  const languageText = languageRows
    .map((item, index) => {
      const y = 318 + index * 34;
      const width = Math.max(10, Math.round(item.percent * 3.1));
      return `
        <text x="790" y="${y}" fill="#E6EDF3" font-family="Segoe UI, ui-sans-serif, system-ui, sans-serif" font-size="15">${escapeXml(item.language)}</text>
        <rect x="978" y="${y - 13}" width="310" height="7" rx="3.5" fill="#1A2431"/>
        <rect x="978" y="${y - 13}" width="${width}" height="7" rx="3.5" fill="${index === 0 ? "#F6C56F" : "#7DD3FC"}"/>
        <text x="1304" y="${y - 5}" fill="#93A4B7" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12" text-anchor="end">${item.percent.toFixed(1)}%</text>`;
    })
    .join("");
  const activityText = activityRows
    .slice(0, 4)
    .map((item, index) => {
      const y = 486 + index * 28;
      return `<text x="790" y="${y}" fill="#93A4B7" font-family="Segoe UI, ui-sans-serif, system-ui, sans-serif" font-size="14">${escapeXml(item)}</text>`;
    })
    .join("");

  return `<svg width="1400" height="640" viewBox="0 0 1400 640" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc">
  <title id="title">Live GitHub Telemetry for ${escapeXml(USERNAME)}</title>
  <desc id="desc">A generated GitHub profile telemetry panel built from public GitHub API data.</desc>
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1400" y2="640" gradientUnits="userSpaceOnUse">
      <stop stop-color="#080B10"/>
      <stop offset="0.55" stop-color="#0D1117"/>
      <stop offset="1" stop-color="#121922"/>
    </linearGradient>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse">
      <path d="M44 0H0V44" stroke="#E6EDF3" stroke-opacity="0.032"/>
    </pattern>
    <linearGradient id="orbit" x1="172" y1="478" x2="1228" y2="134" gradientUnits="userSpaceOnUse">
      <stop stop-color="#7DD3FC" stop-opacity="0.20"/>
      <stop offset="0.56" stop-color="#7DD3FC" stop-opacity="0.72"/>
      <stop offset="1" stop-color="#F6C56F" stop-opacity="0.35"/>
    </linearGradient>
  </defs>
  <rect width="1400" height="640" rx="10" fill="url(#bg)"/>
  <rect width="1400" height="640" rx="10" fill="url(#grid)"/>
  <rect x="42" y="42" width="1316" height="556" rx="8" stroke="#E6EDF3" stroke-opacity="0.12"/>
  <path d="M106 518C296 206 598 109 878 188C1056 238 1176 219 1298 106" stroke="url(#orbit)" stroke-width="1.4"/>
  <path d="M106 518H1298M106 106H1298" stroke="#E6EDF3" stroke-opacity="0.08"/>

  <text x="78" y="95" fill="#7DD3FC" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="13" letter-spacing="3">PUBLIC GITHUB TELEMETRY / GENERATED</text>
  <text x="78" y="139" fill="#F8FAFC" font-family="Segoe UI, ui-sans-serif, system-ui, sans-serif" font-size="32" font-weight="650">${escapeXml(USERNAME)}</text>
  <text x="78" y="170" fill="#93A4B7" font-family="Segoe UI, ui-sans-serif, system-ui, sans-serif" font-size="16">Aggregate public signal, refreshed by GitHub Actions. Repository names are intentionally omitted.</text>

  <g transform="translate(78 226)">
    ${metricCard(0, 0, "PUBLIC REPOS", compactNumber(data.publicRepos), "#7DD3FC")}
    ${metricCard(250, 0, "FOLLOWERS", compactNumber(data.followers), "#7DD3FC")}
    ${metricCard(0, 152, "TOTAL STARS", compactNumber(data.totalStars), "#F6C56F")}
    ${metricCard(250, 152, "TOTAL FORKS", compactNumber(data.totalForks), "#93A4B7")}
  </g>

  <g transform="translate(596 226)">
    <rect x="0" y="0" width="122" height="304" rx="8" fill="#0B1017" stroke="#E6EDF3" stroke-opacity="0.12"/>
    <text x="26" y="38" fill="#7DD3FC" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12" letter-spacing="2">AGE</text>
    <text x="26" y="88" fill="#F8FAFC" font-family="Segoe UI, ui-sans-serif, system-ui, sans-serif" font-size="34" font-weight="650">${escapeXml(data.yearsActive)}</text>
    <text x="26" y="115" fill="#93A4B7" font-family="Segoe UI, ui-sans-serif, system-ui, sans-serif" font-size="14">years</text>
    <path d="M26 154H96" stroke="#E6EDF3" stroke-opacity="0.12"/>
    <text x="26" y="192" fill="#93A4B7" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11">SINCE</text>
    <text x="26" y="220" fill="#E6EDF3" font-family="Segoe UI, ui-sans-serif, system-ui, sans-serif" font-size="14">${escapeXml(formatDate(data.createdAt))}</text>
    <text x="26" y="263" fill="#93A4B7" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11">LATEST</text>
    <text x="26" y="291" fill="#E6EDF3" font-family="Segoe UI, ui-sans-serif, system-ui, sans-serif" font-size="14">${escapeXml(formatDate(data.latestPublicUpdate))}</text>
  </g>

  <text x="790" y="260" fill="#F6C56F" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12" letter-spacing="2">LANGUAGE MASS</text>
  ${languageText}

  <text x="790" y="444" fill="#F6C56F" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12" letter-spacing="2">LAST 30 DAYS / PUBLIC EVENTS</text>
  ${activityText}

  <text x="78" y="570" fill="#58677A" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="12">REFRESHED ${escapeXml(formatDateTime(data.refreshedAt))} / SOURCE api.github.com / PRIVATE CONTRIBUTIONS EXCLUDED</text>
</svg>`;
}

function metricCard(x, y, label, value, accent) {
  return `<g transform="translate(${x} ${y})">
    <rect x="0" y="0" width="220" height="118" rx="8" fill="#0B1017" stroke="#E6EDF3" stroke-opacity="0.12"/>
    <text x="22" y="36" fill="${accent}" font-family="ui-monospace, SFMono-Regular, Menlo, Consolas, monospace" font-size="11" letter-spacing="2">${label}</text>
    <text x="22" y="86" fill="#F8FAFC" font-family="Segoe UI, ui-sans-serif, system-ui, sans-serif" font-size="42" font-weight="650">${escapeXml(value)}</text>
  </g>`;
}

function buildMarkdown(data) {
  const topLanguages = data.languages.length
    ? data.languages.slice(0, 5).map((item) => `${item.language} ${item.percent.toFixed(1)}%`).join(" / ")
    : "No public language data";
  const activity = data.activity.length ? data.activity.join(" / ") : "No public events in the last 30 days";

  return `${START}
<p align="center">
  <img src="./assets/github-telemetry.svg" alt="Live GitHub telemetry for ${USERNAME}" width="100%" />
</p>

<p align="center">
  <img src="./assets/contribution-tiles.svg" alt="Generated contribution tile field for ${USERNAME}" width="100%" />
</p>

| Signal | Public GitHub API value |
|---|---:|
| Public repositories | ${data.publicRepos} |
| Followers | ${data.followers} |
| Total public stars | ${data.totalStars} |
| Total public forks | ${data.totalForks} |
| Top visible languages | ${topLanguages} |
| Contribution tile source | ${data.contributions.source} |
| Last 12 months contributions | ${data.contributions.total} |
| Recent public activity | ${activity} |
| Last public repository update | ${formatDate(data.latestPublicUpdate)} |
| Telemetry refresh | ${formatDateTime(data.refreshedAt)} |

${END}`;
}

function replaceBetweenMarkers(readme, generated) {
  if (!readme.includes(START) || !readme.includes(END)) {
    throw new Error(`README.md must contain ${START} and ${END} markers.`);
  }
  const startIndex = readme.indexOf(START);
  const endIndex = readme.indexOf(END) + END.length;
  return `${readme.slice(0, startIndex)}${generated}${readme.slice(endIndex)}`;
}

const [user, repos, events] = await Promise.all([
  github(`/users/${USERNAME}`),
  githubAll(`/users/${USERNAME}/repos?type=owner&sort=updated&direction=desc`),
  github(`/users/${USERNAME}/events/public?per_page=100`),
]);

const ownedPublicRepos = repos.filter((repo) => !repo.private);
const languageMaps = await Promise.all(
  ownedPublicRepos
    .filter((repo) => repo.languages_url)
    .map(async (repo) => github(repo.languages_url.replace(API_ROOT, ""))),
);

const latestPublicUpdate = ownedPublicRepos
  .map((repo) => repo.updated_at)
  .filter(Boolean)
  .sort()
  .at(-1);

const data = {
  publicRepos: user.public_repos || ownedPublicRepos.length,
  followers: user.followers || 0,
  totalStars: ownedPublicRepos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0),
  totalForks: ownedPublicRepos.reduce((sum, repo) => sum + (repo.forks_count || 0), 0),
  createdAt: user.created_at,
  yearsActive: String(Math.max(1, new Date().getUTCFullYear() - new Date(user.created_at).getUTCFullYear())),
  latestPublicUpdate,
  languages: summarizeLanguages(languageMaps),
  activity: summarizeActivity(events),
  contributions: await fetchContributionCalendar(events),
  refreshedAt: new Date().toISOString(),
};

await mkdir("assets", { recursive: true });
await writeFile(TELEMETRY_SVG_PATH, buildSvg(data), "utf8");
await writeFile(CONTRIBUTION_TILES_SVG_PATH, buildContributionTilesSvg(data.contributions), "utf8");

const readme = await readFile(README_PATH, "utf8");
await writeFile(README_PATH, replaceBetweenMarkers(readme, buildMarkdown(data)), "utf8");
