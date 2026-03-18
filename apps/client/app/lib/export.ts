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

export function exportPDF(): void {
  const el = document.querySelector('[data-artifact-content]') as HTMLElement | null;
  if (!el) return;

  const ancestors: HTMLElement[] = [];
  let node = el.parentElement;
  while (node && node !== document.body) {
    ancestors.push(node);
    node = node.parentElement;
  }

  document.body.classList.add('__pdf-printing');
  ancestors.forEach((a) => a.classList.add('__pdf-ancestor'));
  el.classList.add('__pdf-target');

  const style = document.createElement('style');
  style.textContent = `
    @media print {
      body.__pdf-printing > *:not(.__pdf-ancestor):not(.__pdf-target) { display: none !important; }
      .__pdf-ancestor {
        display: block !important;
        background: none !important;
        border: none !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        overflow: visible !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .__pdf-ancestor > *:not(.__pdf-ancestor):not(.__pdf-target) { display: none !important; }
      .__pdf-target { display: block !important; }
    }
  `;
  document.head.appendChild(style);

  window.print();

  style.remove();
  document.body.classList.remove('__pdf-printing');
  ancestors.forEach((a) => a.classList.remove('__pdf-ancestor'));
  el.classList.remove('__pdf-target');
}
