// Open-source projects to contribute to.
// 1) YC companies tagged "Open Source" (yc-oss dataset, a daily mirror of YC's directory).
// 2) Each company's GitHub account, as listed on its YC company page (stored in oss_orgs, re-checked monthly).
// 3) GitHub's public issue search for open, unassigned beginner issues in those accounts' repos.
// Results go to oss_projects, one row per repo with one suggested issue. Nothing is guessed: a
// company without a GitHub account on YC, or without beginner issues, simply isn't listed.
// Runs as an enricher; it stores its own table and returns no startups.
import type { DiscoveryContext, StartupSource } from "@/lib/types";
import { cachedJson, cachedText, isCached } from "@/lib/http";
import { query } from "@/lib/database";
import { settings } from "@/config/settings";
import { githubAccountUrl, parseYcPage } from "@/sources/yc";

const TAG_URL = "https://yc-oss.github.io/api/tags/open-source.json";
const YC = "https://www.ycombinator.com";
const SEARCH = "https://api.github.com/search/issues";
/** GitHub ORs a comma-separated label list. */
const BEGINNER_LABELS = `label:"good first issue","good-first-issue","help wanted"`;

interface OssCompany {
  name: string;
  slug: string;
  website: string;
  one_liner: string;
  batch: string;
  status: string;
  isHiring: boolean;
  launched_at: number;
}

export interface GhIssue {
  title: string;
  html_url: string;
  repository_url: string; // https://api.github.com/repos/<owner>/<name>
  labels: { name: string }[];
  comments: number;
  updated_at: string;
  pull_request?: unknown;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** "owner/name" from an issue's repository_url. */
export const repoOf = (i: Pick<GhIssue, "repository_url">) => i.repository_url.split("/repos/")[1] ?? "";

/** The issue to suggest: labelled "good first issue" first, then fewest comments (least taken), then most recently updated. */
export function pickSuggestedIssue(issues: GhIssue[]): GhIssue {
  const gfi = (i: GhIssue) => i.labels.some((l) => /^good[\s-]first[\s-]issue$/i.test(l.name));
  return [...issues].sort(
    (a, b) => Number(gfi(b)) - Number(gfi(a)) || a.comments - b.comments || b.updated_at.localeCompare(a.updated_at)
  )[0];
}

/** Search query for one batch of GitHub accounts (`user:` works for organisations and personal accounts). */
export function beginnerIssueQuery(accounts: string[], since: string): string {
  return `is:issue is:open no:assignee archived:false ${BEGINNER_LABELS} updated:>=${since} ${accounts.map((a) => `user:${a}`).join(" ")}`;
}

async function refreshOpenSource(log: (m: string) => void) {
  const runStart = new Date();
  const all = await cachedJson<OssCompany[]>(TAG_URL, settings.cacheHours.ycDirectory);
  // Hiring companies first, then the newest.
  const active = all
    .filter((c) => c.status === "Active" && c.slug)
    .sort((a, b) => Number(b.isHiring) - Number(a.isHiring) || (b.launched_at ?? 0) - (a.launched_at ?? 0));
  const bySlug = new Map(active.map((c) => [c.slug, c]));

  // 1) GitHub account per company, from its YC page.
  const rows = await query<{ slug: string; github_org: string | null; checked_at: Date }>("SELECT slug, github_org, checked_at FROM oss_orgs");
  const known = new Map(rows.map((r) => [r.slug, r]));
  const monthAgo = Date.now() - 30 * 86_400_000;
  const toCheck = active.filter((c) => !known.has(c.slug) || new Date(known.get(c.slug)!.checked_at).getTime() < monthAgo).slice(0, settings.ossMaxCompanyPages);
  for (const c of toCheck) {
    const pageUrl = `${YC}/companies/${c.slug}`;
    try {
      const company = parseYcPage(await cachedText(pageUrl, settings.cacheHours.ycCompanyPage))?.company ?? {};
      const org = githubAccountUrl(company.github_url)?.replace("https://github.com/", "") ?? null;
      await query(
        `INSERT INTO oss_orgs (slug, company_name, github_org, checked_at) VALUES ($1, $2, $3, now())
         ON CONFLICT (slug) DO UPDATE SET company_name = EXCLUDED.company_name, github_org = EXCLUDED.github_org, checked_at = now()`,
        [c.slug, c.name, org]
      );
      known.set(c.slug, { slug: c.slug, github_org: org, checked_at: new Date() });
    } catch (e) {
      log(`Open source: skipped ${c.name} (${(e as Error).message})`);
    }
  }
  log(`Open source: ${active.length} active YC open-source companies; read ${toCheck.length} YC pages.`);

  // 2) Search beginner issues, accounts searched longest ago first.
  const searched = await query<{ slug: string }>("SELECT slug FROM oss_orgs WHERE github_org IS NOT NULL ORDER BY searched_at NULLS FIRST");
  const targets = searched
    .map((r) => ({ c: bySlug.get(r.slug), org: known.get(r.slug)?.github_org }))
    .filter((t): t is { c: OssCompany; org: string } => !!t.c && !!t.org);
  const chunks: (typeof targets)[] = [];
  for (let i = 0; i < targets.length && chunks.length < settings.ossMaxSearches; i += settings.ossOrgsPerSearch) {
    chunks.push(targets.slice(i, i + settings.ossOrgsPerSearch));
  }

  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  if (token) headers.Authorization = `Bearer ${token}`;
  // Search allows 10 requests/minute without a token, 30 with one.
  const gap = token ? 2_100 : 6_500;
  const since = new Date(Date.now() - settings.ossIssueMaxAgeDays * 86_400_000).toISOString().slice(0, 10);

  let repos = 0;
  for (const [n, chunk] of chunks.entries()) {
    const q = beginnerIssueQuery(chunk.map((t) => t.org), since);
    const url = `${SEARCH}?q=${encodeURIComponent(q)}&sort=updated&order=desc&per_page=100`;
    if (n > 0 && !isCached(url, settings.cacheHours.githubSearch)) await sleep(gap);
    let items: GhIssue[];
    try {
      items = ((await cachedJson<{ items: GhIssue[] }>(url, settings.cacheHours.githubSearch, { headers })).items ?? []).filter((i) => !i.pull_request);
    } catch (e) {
      log(`Open source: GitHub search failed (${(e as Error).message}); trying again next run.`);
      break; // most likely the rate limit; the rest waits for the next run
    }
    const byOwner = new Map(chunk.map((t) => [t.org.toLowerCase(), t]));
    const byRepo = new Map<string, GhIssue[]>();
    for (const i of items) {
      const repo = repoOf(i);
      if (repo) byRepo.set(repo, [...(byRepo.get(repo) ?? []), i]);
    }
    for (const [repo, issues] of byRepo) {
      const t = byOwner.get(repo.split("/")[0].toLowerCase());
      if (!t) continue;
      const pick = pickSuggestedIssue(issues);
      await query(
        `INSERT INTO oss_projects (repo, github_org, company_name, company_yc_url, company_website, one_liner, yc_batch, hiring,
           beginner_issues, issue_title, issue_url, issue_labels, issue_comments, issue_updated_at, fetched_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, now())
         ON CONFLICT (repo) DO UPDATE SET github_org = EXCLUDED.github_org, company_name = EXCLUDED.company_name,
           company_yc_url = EXCLUDED.company_yc_url, company_website = EXCLUDED.company_website, one_liner = EXCLUDED.one_liner,
           yc_batch = EXCLUDED.yc_batch, hiring = EXCLUDED.hiring, beginner_issues = EXCLUDED.beginner_issues,
           issue_title = EXCLUDED.issue_title, issue_url = EXCLUDED.issue_url, issue_labels = EXCLUDED.issue_labels,
           issue_comments = EXCLUDED.issue_comments, issue_updated_at = EXCLUDED.issue_updated_at, fetched_at = now()`,
        [
          repo, t.org, t.c.name, `${YC}/companies/${t.c.slug}`, t.c.website || null, t.c.one_liner || null, t.c.batch || null, !!t.c.isHiring,
          issues.length, pick.title, pick.html_url, pick.labels.map((l) => l.name), pick.comments, pick.updated_at,
        ]
      );
      repos++;
    }
    // Repos of these accounts that no longer have beginner issues drop out.
    await query("DELETE FROM oss_projects WHERE lower(github_org) = ANY($1) AND fetched_at < $2", [[...byOwner.keys()], runStart]);
    await query("UPDATE oss_orgs SET searched_at = now() WHERE slug = ANY($1)", [chunk.map((t) => t.c.slug)]);
  }
  await query("DELETE FROM oss_projects WHERE fetched_at < now() - interval '21 days'");
  log(`Open source: searched ${chunks.reduce((n, c) => n + c.length, 0)} GitHub accounts, ${repos} repos with beginner issues.`);
}

export const ossSource: StartupSource = {
  id: "oss_github",
  name: "Open-source projects (YC + GitHub)",
  disabledReason: () => null,
  async discover(ctx: DiscoveryContext) {
    await refreshOpenSource(ctx.log);
    return [];
  },
};
