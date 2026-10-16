#!/usr/bin/env node
// Lightweight static-site preflight. No dependencies or network calls.
import { readFileSync, statSync } from "node:fs";
const failures=[];
function check(n,ok,d=""){console.log((ok?"PASS ":"FAIL ")+n+(d?" — "+d:""));if(!ok)failures.push(n);}
function read(p){return readFileSync(new URL("../"+p,import.meta.url),"utf8");}
let index,css,app,readme,workflow,resume,notFound,sitemap,robots;
try{index=read("index.html");css=read("assets/style.css");app=read("assets/app.js");readme=read("README.md");workflow=read(".github/workflows/deploy-pages.yml");resume=JSON.parse(read("data/resume.public.json"));notFound=read("404.html");sitemap=read("sitemap.xml");robots=read("robots.txt");}catch(e){console.error("FAIL fixture-load — "+e.message);process.exit(1);}
const CANON="https://shaiinarab.github.io/shaiinarab/";
for(const id of ["main","hero-title","interests","library","offscreen","repo-search","lang-chips","repo-grid","result-line","repo-status","api-note","repo-retry","theme-toggle","year"])check("index:id-"+id,index.includes('id="'+id+'"'));
check("index:canonical",index.includes('<link rel="canonical" href="'+CANON+'">'));
check("index:metadata",index.includes('property="og:title"')&&index.includes('name="twitter:card"'));
check("index:jsonld-valid",(()=>{try{JSON.parse(index.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);return true;}catch(_){return false;}})());
check("index:interest-sections",/AI\s*&/.test(index)&&index.includes("Fundamentals of algorithms")&&index.includes("Music production"));
check("index:honest-status-language",index.includes("not a wall of self-awarded project medals")&&index.includes("not a measure of the author's proficiency"));
check("index:no-remote-js",!/<script[^>]+src=["']https?:\/\//i.test(index));
check("index:no-vendored-frameworks",!/vendor\/(?:htmx|alpine|_hyperscript|tailwind)/i.test(index));
check("index:reduced-motion-style",css.includes("prefers-reduced-motion"));
check("index:responsive-breakpoints",css.includes("max-width:760px")&&css.includes("max-width:430px"));
check("index:theme-contrast",css.includes('html[data-theme="dark"]')&&css.includes("prefers-contrast:more"));
check("index:print-styles",css.includes("@media print"));
check("index:keyboard-focus",css.includes(":focus-visible")&&index.includes('class="skip-link"'));
check("index:repo-escaping",/function esc\(v\)/.test(app)&&app.includes("noopener noreferrer"));
check("index:offline-fallback",/FALLBACK_REPOS/.test(app)&&app.includes("readCache")&&app.includes("fetchPublicRepos"));
check("index:repo-descriptions-not-trusted",!/repo\.description|r\.description/.test(app));
check("index:query-shareable",app.includes("history.replaceState")&&app.includes("URLSearchParams"));
check("index:keyboard-search",app.includes('e.key!=="/"'));
check("index:time-bounded-requests",app.includes("AbortSignal.timeout"));
check("index:theme-preference",app.includes("field-notes-theme")&&app.includes("localStorage"));
check("index:no-analytics",!/google-analytics|googletagmanager|plausible\.io|umami\.is/i.test(index+app));
check("readme:maximalist-markdown",readme.includes(String.fromCharCode(96).repeat(3)+"mermaid")&&readme.includes("<details>")&&readme.includes("<blockquote>")&&readme.includes("| Signal |"));
check("readme:student-position",readme.includes("Computer Engineering student")&&readme.includes("in progress"));
check("readme:institution-mentioned-once",(readme.match(/Zand Institute of Higher Education/g)||[]).length===1);
check("readme:no-inflated-skills",!/\bCUDA\b|\bOpenCL\b|\bMojo\b|Researcher|professional software engineer/i.test(readme));
check("readme:no-private-health-or-substance-data",!/AuDHD|cannabis|psilocybin|diagnosis|medication/i.test(readme));
check("readme:has-custom-visual",readme.includes("assets/constellation.svg"));
check("resume:valid-json",resume.basics&&resume.basics.name==="Shahin Arab"&&Array.isArray(resume.projects));
check("resume:no-claimed-projects",resume.projects.length===0);
check("workflow:deploy-v4",workflow.includes("actions/deploy-pages@v4"));
check("workflow:push-deploy-condition",workflow.includes("always() && (github.event_name == 'push'"));
check("workflow:verify-before-deploy",workflow.includes("node scripts/verify.mjs")&&workflow.includes("node --check assets/app.js"));
check("workflow:no-vendor-payload",!/cp -r vendor _site\/vendor/.test(workflow));
check("crawler:robots-and-sitemap",robots.trim().endsWith("Sitemap: "+CANON+"sitemap.xml")&&sitemap.includes("<loc>"+CANON+"</loc>"));
check("404:back-to-site",notFound.includes("/shaiinarab/"));
check("svg:custom-illustration",(()=>{const s=read("assets/constellation.svg");return s.includes("<svg")&&s.includes("</svg>")&&s.length>1000;})());
for(const asset of ["assets/og.png","assets/fonts/caveat-latin.woff2"]){try{const st=statSync(new URL("../"+asset,import.meta.url));check("asset:"+asset,st.size>100);}catch(e){check("asset:"+asset,false,"missing");}}
console.log(failures.length?"\nRED — "+failures.length+" checks failed":"\nGREEN — all checks passing");process.exit(failures.length?1:0);
