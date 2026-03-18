export interface ExportData {
  query: string;
  artifact: string;
  sources: string[];
  created_at: string;
  updated_at: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

function downloadBlob(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadMarkdown(data: ExportData): void {
  const escaped = data.query.replace(/"/g, '\\"');
  const header = [
    '---',
    `query: "${escaped}"`,
    `created_at: "${data.created_at}"`,
    `exported_at: "${new Date().toISOString()}"`,
    '---',
    '',
    '',
  ].join('\n');
  downloadBlob(header + data.artifact, `${slugify(data.query)}.md`, 'text/markdown;charset=utf-8');
}

export function downloadJSON(data: ExportData): void {
  const payload = {
    query: data.query,
    artifact: data.artifact,
    sources: data.sources,
    metadata: {
      created_at: data.created_at,
      updated_at: data.updated_at,
      exported_at: new Date().toISOString(),
    },
  };
  downloadBlob(
    JSON.stringify(payload, null, 2),
    `${slugify(data.query)}.json`,
    'application/json;charset=utf-8',
  );
}

export function exportPDF(query: string): void {
  const el = document.querySelector('[data-artifact-content]');
  if (!el) return;

  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) return;

  const safeQuery = query.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${safeQuery}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 680px;
      margin: 48px auto;
      padding: 0 24px;
      color: #111;
      line-height: 1.6;
    }
    h1 { font-size: 1.3em; font-weight: 600; margin: 0 0 4px; }
    h2 {
      font-size: 0.7em;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #888;
      margin: 2em 0 0.75em;
    }
    h3 { font-size: 0.85em; font-weight: 600; color: #333; margin: 1.5em 0 0.5em; }
    p { font-size: 0.875em; color: #444; margin: 0.4em 0; }
    ul { margin: 0.5em 0; padding-left: 0; list-style: none; }
    li { font-size: 0.875em; color: #444; margin: 0.3em 0; padding-left: 14px; position: relative; }
    li::before { content: '·'; position: absolute; left: 0; color: #bbb; }
    a { color: #4f46e5; word-break: break-all; }
    hr { border: none; border-top: 1px solid #eee; margin: 1.5em 0; }
    strong { font-weight: 600; color: #111; }
    @media print { body { margin: 0; padding: 16px; } }
  </style>
</head>
<body>
${el.innerHTML}
<script>
  setTimeout(function() {
    window.print();
    window.onafterprint = function() { window.close(); };
  }, 250);
</script>
</body>
</html>`);
  win.document.close();
}
