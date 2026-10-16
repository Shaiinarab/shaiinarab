#!/usr/bin/env node
// Repeatable verification battery for the static hub. Node built-ins only.
// Run: node scripts/verify.mjs   → exit 0 green / 1 red.
import { readFileSync, statSync } from "node:fs";

const CANON = "https://shaiinarab.github.io/shaiinarab/";
const failures = [];

function check(id, ok, detail = "") {
  const mark = ok ? "PASS" : "FAIL";
  console.log(`${mark}  ${id}${detail ? ` — ${detail}` : ""}`);
  if (!ok) failures.push(id);
}

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");

let index, notFound, robots, sitemap, workflow, appJs, readme, css;
try {
  index = read("index.html");
  notFound = read("404.html");
  robots = read("robots.txt");
  sitemap = read("sitemap.xml");
  workflow = read(".github/workflows/deploy-pages.yml");
  appJs = read("assets/app.js");
  readme = read("README.md");
  css = read("assets/style.css");
} catch (e) {
  console.error("FAIL  fixture-load —", e.message);
  process.exit(1);
}

/* ---- index.html ---- */
for (const id of ["repo-grid", "lang-chips", "repo-search", "result-line", "api-note", "retry-btn", "typed", "year"]) {
  check(`index:#${id}`, index.includes(`id="${id}"`));
}
check("index:canonical", index.includes(`<link rel="canonical" href="${CANON}">`));
check("index:preconnect-api", index.includes('rel="preconnect" href="https://api.github.com"'));
check("index:search-aria-label", /id="repo-search"[^>]*aria-label=/.test(index));
check("index:no-status-on-terminal", !/<pre class="term-body mono" role="status"/.test(index));

let jsonldOk = false;
try {
  const m = index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  JSON.parse(m[1]);
  jsonldOk = true;
} catch { /* red */ }
check("index:jsonld-parses", jsonldOk);

/* ---- 404.html ---- */
check("404:absolute-stylesheet", notFound.includes('href="/shaiinarab/assets/style.css"'));
check("404:no-root-relative-links", !/\bhref="\/"(?!shaiinarab)/.test(notFound));
check("404:canonical-back-link", notFound.includes('href="/shaiinarab/"'));

/* ---- crawler files ---- */
check("robots:sitemap-matches-canon", robots.trim().endsWith(`Sitemap: ${CANON}sitemap.xml`));
check("sitemap:loc-is-canonical", sitemap.includes(`<loc>${CANON}</loc>`));
check("sitemap:lastmod-present", /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sitemap));

/* ---- consistency across surfaces ---- */
const canonInIndex = index.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
const locInSitemap = sitemap.match(/<loc>([^<]+)<\/loc>/)?.[1];
check("consistency:canon-equals-sitemap", !!canonInIndex && canonInIndex === locInSitemap);

/* ---- deploy workflow ---- */
check("workflow:deploy-pages-v4", workflow.includes("actions/deploy-pages@v4"));
check("workflow:triggers-main", /branches:\s*(\n\s*-\s*|\[)\s*main/.test(workflow));
check("workflow:pages-write-perm", workflow.includes("pages: write"));

/* ---- directory engine hygiene ---- */
check("appjs:esc-used-for-html-injection", /(?:function esc\(|const esc = \()/u.test(appJs) && /\$\{esc\(r\.name\)\}/.test(appJs));
check("appjs:fallback-snapshot-exists", appJs.includes("FALLBACK_REPOS"));
check("appjs:timeout-guard", appJs.includes("AbortSignal.timeout"));
check("appjs:noreferrer-on-cards", appJs.includes('rel="noopener noreferrer"'));

/* ---- deploy hygiene: ship the site, not the workshop ---- */
check("workflow:verify-gate-before-deploy", workflow.includes("node scripts/verify.mjs"));
check("workflow:stages-site-dir", /path:\s*_site/.test(workflow));
check("workflow:no-whole-repo-upload", !/path:\s*\.\s*$/m.test(workflow));

/* ---- truthful profile README ---- */
check("readme:student-profile", readme.includes("Computer Engineering undergraduate") && readme.includes("Degree in progress"));
check("readme:interests-present", /Artificial intelligence/i.test(readme) && /music production/i.test(readme) && /digital art/i.test(readme));
check("readme:no-inflated-stack", !/CUDA|OpenCL|Mojo|Rust badge|GPU Computing|Knows everything/i.test(readme));
check("readme:short-resume-present", readme.includes("## Short résumé") && readme.includes("## Academic interests"));
check("readme:repo-status-caveat", /work in progress|not a claim/i.test(readme));
check("readme:links-present", readme.includes("https://github.com/Shaiinarab") && readme.includes("https://shaiinarab.github.io/shaiinarab/"));
check("readme:no-unneeded-personal-disclosure", !/AuDHD|cannabis|psilocybin|substances|diagnosis/i.test(readme));
check("readme:no-widget-dependence", !/github-readme-stats|readme-typing-svg|github-trophies|ghchart\.rshah\.org/i.test(readme));



/* ---- UI hardening ---- */
check("index:skip-link", index.includes('class="skip-link"'));
check("index:noscript-fallback", index.includes("<noscript>"));
check("index:token-hero-not-gradient-text", index.includes('class="tok"') && !index.includes('class="grad"'));
check("index:status-feed-not-card-grid", index.includes('class="feed"') && !index.includes("demo-card"));
check("index:colophon-diagram", index.includes('id="colophon"') && index.includes("assets/hub-flow.svg"));
check("index:og-self-hosted", index.includes("assets/og.png") && index.includes('property="og:image:width"'));
check("css:scroll-padding-for-sticky-nav", css.includes("scroll-padding-top"));
check("css:type-tokens", css.includes("--text-body") && css.includes("--text-display") && css.includes("--ease-out"));
check("css:no-unloaded-inter", !/--sans:\s*Inter,/.test(css));
check("css:tabular-numerals", css.includes("tabular-nums"));
check("css:prefers-contrast", css.includes("prefers-contrast: more"));
check("appjs:snapshot-cache", appJs.includes("hub:repos:v1") && appJs.includes("localStorage") && appJs.includes("function readCache"));
check("appjs:shareable-filter-state", appJs.includes("history.replaceState"));

/* ---- shipped assets ---- */
for (const asset of ["assets/og.png", "assets/hub-flow.svg"]) {
  try {
    const st = statSync(new URL(`../${asset}`, import.meta.url));
    check(`asset:${asset}`, st.size > 500, `${st.size} bytes`);
  } catch {
    check(`asset:${asset}`, false, "missing");
  }
}
try {
  const st = statSync(new URL("../assets/fonts/caveat-latin.woff2", import.meta.url));
  check("asset:handwriting-font", st.size > 20000 && st.size < 200000, `${st.size} bytes`);
} catch {
  check("asset:handwriting-font", false, "missing");
}

/* ---- the human layer (redesign invariants) ---- */
check("css:self-hosted-font-no-cdn", css.includes("fonts/caveat-latin.woff2") && !/fonts\.(googleapis|gstatic)/.test(css + index));
check("css:paper-theme", css.includes('[data-theme="paper"]') && css.includes("--ink") && css.includes(".hand"));
check("css:human-accents", css.includes(".note") && css.includes(".seal") && css.includes(".eq"));
check("css:reduced-motion-covers-new-motion", /prefers-reduced-motion[\s\S]*\.eq i/.test(css));
check("index:theme-toggle", index.includes('id="theme-toggle"') && index.includes("hub:theme:v1"));
check("index:human-section", index.includes('id="offclock"') && index.includes("send me a song"));
check("index:annotations", (index.match(/class="note /g) || []).length >= 3 && index.includes('class="doodle"'));
check("index:motion-hooks", index.includes('class="btn btn-primary magnetic"') && index.includes('class="terminal tilt"'));
check("404:theme-aware-and-human", notFound.includes("hub:theme:v1") && notFound.includes("wrong door"));
check("appjs:theme-persisted", appJs.includes("hub:theme:v1") && appJs.includes("prefers-color-scheme"));
check("appjs:living-terminal-typo-fix", appJs.includes("sybc --wit") && appJs.includes("backspace"));
check("appjs:decode-effect", appJs.includes("function decode") && appJs.includes("data-decode"));
check("appjs:toasts", appJs.includes("function toast") && appJs.includes('$("#toasts")'));
check("appjs:easter-egg", appJs.includes('endsWith("shahin")'));
check("appjs:connection-life", appJs.includes('addEventListener("offline"') && appJs.includes('addEventListener("online"'));
check("appjs:seals-on-cards", appJs.includes("const SEALS") && appJs.includes("seal"));
check("appjs:magnetic-and-tilt", appJs.includes(".magnetic") && appJs.includes(".tilt"));

console.log(failures.length ? `\nRED — ${failures.length} failing` : "\nGREEN — all checks passing");
process.exit(failures.length ? 1 : 0);
