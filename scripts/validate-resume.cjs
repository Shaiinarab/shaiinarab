const fs = require('node:fs');

const file = process.argv[2];
const resume = JSON.parse(fs.readFileSync(file, 'utf8'));

const required = [
  ['basics', 'name'],
  ['basics', 'label'],
  ['basics', 'summary'],
];

for (const path of required) {
  let value = resume;
  for (const key of path) value = value?.[key];
  if (!value || (Array.isArray(value) && value.length === 0)) {
    throw new Error(`Missing required public résumé field: ${path.join('.')}`);
  }
}

for (const project of resume.projects) {
  if (!project.name || !project.description || !project.url) {
    throw new Error('Every public project requires name, description, and URL.');
  }
}

if (/(@|phone|mailto:)/i.test(JSON.stringify(resume))) {
  throw new Error('Public résumé snapshot contains a disallowed direct-contact marker.');
}

console.log(`Validated public résumé snapshot: ${resume.basics.name}; ${resume.projects.length} project(s).`);
