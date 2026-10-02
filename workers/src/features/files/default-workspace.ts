import type { Bindings } from '../../bindings'
import { createSql } from '../../db'

export type DefaultWorkspaceFile = {
  path: string
  type: string
  content: string
}

export const DEFAULT_WORKSPACE_TREE = `
./
├── index.html
├── css/
│   └── main.css
├── js/
│   └── main.js
├── pages/
├── components/
├── assets/
│   ├── images/
│   └── fonts/
├── public/
│   └── robots.txt
├── package.json
├── README.md
├── .env.example
└── .gitignore

Rules:
- Home page: index.html (at root).
- Extra pages: pages/*.html.
- CSS: css/main.css, plus css/pages/*.css only when needed.
- JS: js/main.js, plus js/utils/*.js only when needed.
- Reusable UI snippets: components/.
- Media assets: assets/ (e.g. assets/images/, assets/fonts/).
- Direct public static files: public/ (e.g. public/robots.txt).
- Environment: workspace .env is auto-loaded by preview/deploy tooling.
- Browser JS may read env with process.env.KEY or window.__ENV__.KEY.
- You may import env from ./env.js or ../env.js; the platform maps it automatically in preview.
- Do not import .env directly.
- In public deployments, only PUBLIC_* env variables should be exposed.
- dist/ is build output; never create or edit it manually.
`

export async function ensureDefaultWorkspace(env: Bindings, projectId: string): Promise<void> {
  const sql = createSql(env)
  const [{ count }] = await sql`select count(*)::int as count from files where project_id = ${projectId}` as Array<{ count: number }>
  if (count) return
  const now = new Date().toISOString()
  // one multi-row insert = 1 subrequest (free-plan budget) instead of one query per file;
  await sql`
    insert into files (project_id, file_path, content, file_type, created_at, updated_at)
    select ${projectId}, r.path, r.content, r.type, ${now}, ${now}
    from jsonb_to_recordset(${JSON.stringify(DEFAULT_WORKSPACE_FILES.map((f) => ({ path: f.path, content: f.content, type: f.type })))}::jsonb) as r(path text, content text, type text)
    on conflict (project_id, file_path) do nothing
  `
}

export const DEFAULT_WORKSPACE_FILES: DefaultWorkspaceFile[] = [
  {
    path: 'index.html',
    type: 'html',
    content: `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Website Baru</title>
  <link rel="stylesheet" href="css/main.css">
  <script src="js/main.js" defer></script>
</head>
<body>
  <main>
    <h1>Website Baru</h1>
    <p>Mulai bangun website dari struktur standar.</p>
  </main>
</body>
</html>
`,
  },
  {
    path: 'css/main.css',
    type: 'css',
    content: `:root {
  color-scheme: light;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #111827;
  background: #ffffff;
}

* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; }
main { width: min(1120px, calc(100% - 32px)); margin: 0 auto; padding: 64px 0; }
`,
  },
  {
    path: 'js/main.js',
    type: 'javascript',
    content: `// Entry point for page behavior. Workspace .env is available as process.env.KEY / window.__ENV__.KEY in preview.
`,
  },
  { path: 'pages/.gitkeep', type: 'text', content: '' },
  { path: 'components/.gitkeep', type: 'text', content: '' },
  { path: 'assets/images/.gitkeep', type: 'text', content: '' },
  { path: 'assets/fonts/.gitkeep', type: 'text', content: '' },
  { path: 'public/images/.gitkeep', type: 'text', content: '' },
  { path: 'public/robots.txt', type: 'text', content: 'User-agent: *\nAllow: /\n' },
  { path: '.gitignore', type: 'text', content: 'dist/\nnode_modules/\n.env\n' },
  {
    path: '.env.example',
    type: 'text',
    content: `# Workspace env example.
# Preview can expose these to the private iframe as process.env.KEY / window.__ENV__.KEY.
# Public deployments should expose only PUBLIC_* values.
APP_NAME=
PUBLIC_API_URL=
AI_BASE_URL=
AI_MODEL_ID=
AI_API_KEY=
`,
  },
  {
    path: 'package.json',
    type: 'json',
    content: `{
  "scripts": {
    "build": "echo sandbox build handled by publisher"
  }
}
`,
  },
  {
    path: 'README.md',
    type: 'markdown',
    content: `# Website Project

Standard static website. Edit index.html, css/main.css, and js/main.js.
`,
  },
]
