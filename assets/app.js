/* Field Notes: small, dependency-free interactions. */
"use strict";
(() => {
  const USER = "Shaiinarab";
  const SELF_REPO = "shaiinarab";
  const CACHE_KEY = "field-notes:repos:v2";
  const THEME_KEY = "field-notes:theme:v1";
  const LANG_COLORS = {Rust:"#b96f4d",Go:"#168caa",Python:"#4779b5",TypeScript:"#3178b8",JavaScript:"#b5a329",HTML:"#c85c43",CSS:"#7c62a3",Shell:"#708f50",C:"#6c7d8c","C++":"#bb596a",Java:"#a7783b",Kotlin:"#8466ba",Swift:"#bd6753",Ruby:"#a6555c",PHP:"#7a78a8",Lua:"#557f8d",Dart:"#318e91",Nix:"#587fa5",Zig:"#b78045"};
  const $ = (selector, root = document) => root.querySelector(selector);
  const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
  const languageColor = language => LANG_COLORS[language] || "#85858b";
  const dateLabel = value => {
    if (!value) return "date unavailable";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "date unavailable";
    return new Intl.DateTimeFormat(undefined,{year:"numeric",month:"short",day:"numeric"}).format(date);
  };

  // Offline / rate-limited snapshot — regenerated from the live GitHub API by
  // `python3 scripts/refresh-snapshot.py` (uses GITHUB_PAT; CI keeps it fresh).
  const FALLBACK_REPOS = [
    { name: "simorgh", description: null, language: "TypeScript", html_url: "https://github.com/Shaiinarab/simorgh", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "mch", description: null, language: null, html_url: "https://github.com/Shaiinarab/mch", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "pabetoop-club", description: null, language: "Go", html_url: "https://github.com/Shaiinarab/pabetoop-club", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "pabetoop-league", description: null, language: "Go", html_url: "https://github.com/Shaiinarab/pabetoop-league", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "portfolio-context", description: null, language: "JavaScript", html_url: "https://github.com/Shaiinarab/portfolio-context", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "repopulse", description: null, language: "TypeScript", html_url: "https://github.com/Shaiinarab/repopulse", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "Simorgh-edge-gateway", description: null, language: "TypeScript", html_url: "https://github.com/Shaiinarab/Simorgh-edge-gateway", stargazers_count: 0, forks_count: 0, archived: true },
    { name: "Data_Structure_And_Intro_To_Algorithms.CLRS", description: null, language: "Python", html_url: "https://github.com/Shaiinarab/Data_Structure_And_Intro_To_Algorithms.CLRS", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "Data-struct-and-Intro-to-algo-final-project", description: null, language: "Python", html_url: "https://github.com/Shaiinarab/Data-struct-and-Intro-to-algo-final-project", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "mashreghi_asil", description: null, language: "TypeScript", html_url: "https://github.com/Shaiinarab/mashreghi_asil", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "Log-Sentinel", description: null, language: "Python", html_url: "https://github.com/Shaiinarab/Log-Sentinel", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "shiraz-bazaar-telegram-bot", description: null, language: null, html_url: "https://github.com/Shaiinarab/shiraz-bazaar-telegram-bot", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "Mashreghi-asil", description: null, language: null, html_url: "https://github.com/Shaiinarab/Mashreghi-asil", stargazers_count: 0, forks_count: 0, archived: true },
    { name: "Falcons", description: null, language: null, html_url: "https://github.com/Shaiinarab/Falcons", stargazers_count: 0, forks_count: 0, archived: false },
    { name: "to-improve", description: null, language: null, html_url: "https://github.com/Shaiinarab/to-improve", stargazers_count: 0, forks_count: 0, archived: true },
  ];

  const state = {repos:[], user:null, activeLanguage:"All", live:false, cacheTime:null};
  const grid=$("#repo-grid"), search=$("#repo-search"), chips=$("#lang-chips"), status=$("#result-line");
  const apiNote=$("#api-note"), retryButton=$("#retry-btn"), progress=$("#reading-progress");

  function readCache() {
    try {
      const value=JSON.parse(localStorage.getItem(CACHE_KEY)||"null");
      return value && Array.isArray(value.repos) && value.repos.length ? value : null;
    } catch { return null; }
  }
  function writeCache() {
    try {
      localStorage.setItem(CACHE_KEY,JSON.stringify({savedAt:Date.now(),user:state.user,repos:state.repos.map(repo=>({
        name:repo.name,html_url:repo.html_url,language:repo.language,archived:Boolean(repo.archived),
        stargazers_count:repo.stargazers_count||0,forks_count:repo.forks_count||0,pushed_at:repo.pushed_at||null
      }))}));
    } catch { /* storage is optional */ }
  }
  async function getJSON(url) {
    const response=await fetch(url,{
      headers:{Accept:"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28"},
      signal:typeof AbortSignal.timeout==="function" ? AbortSignal.timeout(12000) : undefined
    });
    if(!response.ok) throw new Error("GitHub API HTTP "+response.status);
    return response.json();
  }
  async function load() {
    grid.setAttribute("aria-busy","true");
    grid.innerHTML='<div class="repo-placeholder">Connecting to GitHub’s public API…</div>';
    apiNote.hidden=true;
    try {
      const results=await Promise.all([
        getJSON("https://api.github.com/users/"+USER),
        getJSON("https://api.github.com/users/"+USER+"/repos?per_page=100&sort=pushed")
      ]);
      state.user=results[0];
      state.repos=results[1].filter(repo=>!repo.fork&&repo.name!==SELF_REPO)
        .sort((a,b)=>new Date(b.pushed_at||0)-new Date(a.pushed_at||0));
      state.cacheTime=Date.now();state.live=true;writeCache();
    } catch {
      const cached=readCache();
      state.live=false;state.user=cached?.user||null;
      state.repos=(cached?.repos?.length?cached.repos:FALLBACK_REPOS)
        .filter(repo=>!repo.fork&&repo.name!==SELF_REPO)
        .map(repo=>({name:repo.name,html_url:repo.html_url,language:repo.language,archived:Boolean(repo.archived),
          stargazers_count:repo.stargazers_count||0,forks_count:repo.forks_count||0,pushed_at:repo.pushed_at||null}));
      state.cacheTime=cached?.savedAt||null;apiNote.hidden=false;
    }
    renderFilters();renderRepos();renderStats();
  }
  function renderStats() {
    const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
    const langs=new Set(state.repos.map(repo=>repo.language).filter(Boolean));
    set("stat-repos",state.user?String(state.user.public_repos):String(state.repos.length));
    set("stat-languages",String(langs.size));set("stat-followers",state.user?String(state.user.followers):"—");
  }
  function filteredRepos() {
    const query=search.value.trim().toLocaleLowerCase();
    return state.repos.filter(repo=>(state.activeLanguage==="All"||repo.language===state.activeLanguage)&&(!query||repo.name.toLocaleLowerCase().includes(query)));
  }
  function renderFilters() {
    const counts=new Map();
    for(const repo of state.repos) if(repo.language) counts.set(repo.language,(counts.get(repo.language)||0)+1);
    const languages=["All",...[...counts.keys()].sort((a,b)=>a.localeCompare(b))];
    if(!languages.includes(state.activeLanguage)) state.activeLanguage="All";
    chips.innerHTML=languages.map(language=>{
      const selected=language===state.activeLanguage;
      const suffix=language==="All"?"":" <span>"+counts.get(language)+"</span>";
      return '<button class="filter-chip'+(selected?" is-active":"")+'" type="button" data-lang="'+escapeHTML(language)+'" aria-pressed="'+selected+'">'+escapeHTML(language)+suffix+'</button>';
    }).join("");
  }
  function repoCard(repo) {
    const archived=Boolean(repo.archived);
    const language=repo.language
      ? '<span class="repo-language"><i style="--language-color:'+languageColor(repo.language)+'"></i>'+escapeHTML(repo.language)+'</span>'
      : '<span class="repo-language">Language not specified</span>';
    const badge=archived?'<span class="repo-badge repo-badge--archived">ARCHIVED</span>':'<span class="repo-badge">PUBLIC REPOSITORY</span>';
    return '<article class="repo-card'+(archived?' is-archived':'')+'"><div class="repo-card-head">'+language+badge+'</div>'+
      '<h3><a href="'+escapeHTML(repo.html_url)+'" target="_blank" rel="noopener noreferrer">'+escapeHTML(repo.name)+' <span aria-hidden="true">↗</span></a></h3>'+
      '<p class="repo-card-note">Open the repository to inspect its README, source, and history. Completeness varies.</p>'+
      '<div class="repo-card-foot"><span>Updated '+dateLabel(repo.pushed_at)+'</span><span>★ '+(Number(repo.stargazers_count)||0)+'</span><span>⑂ '+(Number(repo.forks_count)||0)+'</span></div></article>';
  }
  function renderRepos() {
    const visible=filteredRepos();
    grid.setAttribute("aria-busy","false");
    grid.innerHTML=visible.length?visible.map(repoCard).join(""):'<div class="repo-placeholder">No repositories match that filter. Try another name or language.</div>';
    status.textContent=state.live
      ? visible.length+" shown · "+state.repos.length+" public non-fork repositories · live GitHub data"
      : visible.length+" shown · "+(state.cacheTime?"saved snapshot from "+new Date(state.cacheTime).toLocaleString():"built-in offline snapshot")+" · live sync unavailable";
    updateURLState();
  }
  function updateURLState() {
    const url=new URL(location.href);
    if(search.value.trim())url.searchParams.set("q",search.value.trim());else url.searchParams.delete("q");
    if(state.activeLanguage!=="All")url.searchParams.set("lang",state.activeLanguage);else url.searchParams.delete("lang");
    history.replaceState(null,"",url.pathname+(url.searchParams.toString()?"?"+url.searchParams:"")+url.hash);
  }
  function restoreURLState() {
    const params=new URLSearchParams(location.search);search.value=params.get("q")||"";state.activeLanguage=params.get("lang")||"All";
  }
  chips.addEventListener("click",event=>{
    const button=event.target.closest("button[data-lang]");if(!button)return;
    state.activeLanguage=button.dataset.lang;renderFilters();renderRepos();
  });
  let searchFrame=0;
  search.addEventListener("input",()=>{cancelAnimationFrame(searchFrame);searchFrame=requestAnimationFrame(renderRepos);});
  search.addEventListener("keydown",event=>{if(event.key==="Escape"){search.value="";renderRepos();}});
  retryButton.addEventListener("click",load);
  document.addEventListener("keydown",event=>{
    if(event.key!=="/"||event.ctrlKey||event.metaKey||event.altKey)return;
    if(event.target instanceof HTMLElement&&/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;
    event.preventDefault();search.focus();
  });
  const themeButton=$("#theme-toggle");
  function setTheme(theme,persist=true) {
    document.documentElement.dataset.theme=theme;
    const dark=theme==="night";
    themeButton.setAttribute("aria-pressed",String(dark));
    themeButton.setAttribute("aria-label",dark?"Switch to light theme":"Switch to dark theme");
    $(".theme-label",themeButton).textContent=dark?"Day mode":"Night shift";
    if(persist){try{localStorage.setItem(THEME_KEY,theme);}catch{/* optional */}}
  }
  try {
    const saved=localStorage.getItem(THEME_KEY);
    const preferred=matchMedia("(prefers-color-scheme: dark)").matches?"night":"day";
    setTheme(saved||preferred,false);
  } catch { setTheme("day",false); }
  themeButton.addEventListener("click",()=>setTheme(document.documentElement.dataset.theme==="night"?"day":"night"));
  $("#year").textContent=String(new Date().getFullYear());
  let ticking=false;
  addEventListener("scroll",()=>{
    if(ticking)return;ticking=true;
    requestAnimationFrame(()=>{
      const max=document.documentElement.scrollHeight-innerHeight;
      progress.style.transform="scaleX("+(max>0?Math.min(1,scrollY/max):0)+")";ticking=false;
    });
  },{passive:true});
  addEventListener("online",load);
  restoreURLState();load();
})();