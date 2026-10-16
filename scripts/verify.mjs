#!/usr/bin/env node
// Dependency-free smoke tests for the public field-notes site.
import { readFileSync, statSync } from "node:fs";
const CANON = "https://shaiinarab.github.io/shaiinarab/";
const failures = [];
function check(id, ok, detail = "") {
  console.log((ok ? "PASS  " : "FAIL  ") + id + (detail ? " — " + detail : ""));
  if (!ok) failures.push(id);
}
function read(path) { return readFileSync(new URL("../" + path, import.meta.url), "utf8"); }
let index, notFound, app, css, readme, resume, workflowText, sitemapText, banner;
try {
  index=read("index.html"); notFound=read("404.html"); app=read("assets/app.js"); css=read("assets/style.css");
  readme=read("README.md"); resume=JSON.parse(read("data/resume.public.json")); workflowText=read(".github/workflows/deploy-pages.yml");
  sitemapText=read("sitemap.xml"); banner=read("assets/profile-banner.svg");
} catch(error) { console.error("FAIL fixture-load — " + error.message); process.exit(1); }
check("html:language",index.includes('<html lang="en">'));
check("html:canonical",index.includes('<link rel="canonical" href="' + CANON + '">'));
check("html:description",/<meta name="description" content="[^"]{50,}">/.test(index));
check("html:open-graph",index.includes('property="og:title"')&&index.includes('property="og:image"'));
check("html:jsonld-valid",(()=>{try{const m=index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);JSON.parse(m[1]);return true;}catch{return false;}})());
check("html:no-framework-scripts",!/vendor\/(htmx|alpine|_hyperscript|tailwind)/i.test(index));
check("html:skip-link",index.includes('class="skip-link" href="#main"'));
check("html:labelled-navigation",index.includes('<nav class="main-nav" aria-label="Main navigation">'));
check("html:keyboard-search",index.includes('placeholder="Search by repository name… (press /)"'));
for(const id of ["top","interests","profile","now","life","directory","contact","repo-search","lang-chips","repo-grid","result-line","api-note","retry-btn","theme-toggle","year"]) check("html:id-"+id,index.includes('id="'+id+'"'));
check("html:honest-student-copy",/Computer Engineering student/.test(index)&&/Still learning the foundations/.test(index));
check("html:no-inflated-claims",!/CUDA expert|Rust expert|professional researcher|production-grade software/i.test(index));
check("html:repository-status-caveat",/descriptions are intentionally omitted/i.test(index));
check("readme:custom-banner",readme.includes("assets/profile-banner.svg"));
check("readme:maximalist-markdown",readme.includes("| Coordinates | Section |")&&readme.includes("<details>")&&readme.includes("flowchart TD")&&readme.includes("!["));
check("readme:academic-interests",readme.includes("Artificial intelligence")&&readme.includes("Linear algebra"));
check("readme:student-honesty",/not an established engineer or researcher/.test(readme));
check("readme:school-mentioned-once",(readme.match(/Zand Institute of Higher Education/g)||[]).length===1);
check("readme:hobbies",readme.includes("FL Studio")&&readme.includes("Ableton Live")&&readme.includes("Digital art"));
check("readme:no-private-health-substance-details",!/AuDHD|cannabis|psilocybin|diagnosis/i.test(readme));
check("readme:no-false-skill-inventory",!/CUDA developer|Rust expert|Go expert|Mojo expert|GPU computing specialist/i.test(readme));
check("app:live-github-api",app.includes("api.github.com/users/")&&app.includes("per_page=100&sort=pushed"));
check("app:offline-snapshot",app.includes("const FALLBACK_REPOS = ["));
check("app:cache",app.includes("field-notes:repos:v2"));
check("app:search-filter",app.includes("renderFilters")&&app.includes("filteredRepos")&&app.includes("activeLanguage"));
check("app:no-repo-descriptions-rendered",!app.includes("repo.description")&&!app.includes("r.description"));
check("app:keyboard-shortcut",app.includes('event.key!=="/"'));
check("app:theme-persisted",app.includes("field-notes:theme:v1"));
check("css:design-tokens",css.includes("--paper:")&&css.includes("--lime:")&&css.includes("--coral:")&&css.includes("--violet:"));
check("css:responsive-layouts",css.includes("@media(max-width:1000px)")&&css.includes("@media(max-width:700px)"));
check("css:visible-focus",css.includes(":focus-visible"));
check("css:reduced-motion",css.includes("prefers-reduced-motion:reduce"));
check("css:no-external-fonts",!/fonts\.(googleapis|gstatic)/.test(css+index));
check("css:no-framework-runtime",!/tailwind|alpine|hyperscript|htmx/i.test(index));
check("resume:identity",resume.basics?.name==="Shahin Arab");
check("resume:education",Array.isArray(resume.education)&&resume.education.length===1);
check("resume:no-invented-projects",Array.isArray(resume.projects)&&resume.projects.length===0);
check("resume:interests-not-skill-inventory",Array.isArray(resume.interests)&&!resume.skills);
check("resume:no-contact-leak",!(/(@|phone|mailto:)/i.test(JSON.stringify(resume))));
check("workflow:verify-before-deploy",workflowText.includes("node scripts/verify.mjs"));
check("workflow:push-deploy-condition",workflowText.includes("always() && (github.event_name == 'push'"));
check("workflow:no-vendor-deploy",!workflowText.includes("cp -r vendor _site/vendor"));
check("workflow:stage-assets",workflowText.includes("cp -r assets _site/assets")&&workflowText.includes("cp data/resume.public.json _site/"));
check("404:home-link",notFound.includes('href="./"'));
check("sitemap:canonical",sitemapText.includes("<loc>"+CANON+"</loc>"));
check("sitemap:lastmod",/<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/.test(sitemapText));
check("asset:banner-svg",banner.includes("<svg")&&banner.includes("viewBox=")&&banner.length>500);
for(const path of ["assets/og.png","assets/hub-flow.svg"]) {try{check("asset:"+path,statSync(new URL("../"+path,import.meta.url)).size>500);}catch{check("asset:"+path,false,"missing");}}
console.log(failures.length ? "\nRED — " + failures.length + " failing check(s)" : "\nGREEN — all checks passed");
process.exit(failures.length?1:0);
