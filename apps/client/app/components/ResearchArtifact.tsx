'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ResearchArtifact as ArtifactData } from '../lib/types';
import ExportButton from './ExportButton';

export default function ResearchArtifact({
  artifact,
  query,
  kbId,
}: {
  artifact: ArtifactData;
  query?: string;
  kbId?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const metaPills = [
    artifact.agentCount != null && `${artifact.agentCount} agents`,
    artifact.sourceCount != null && `${artifact.sourceCount} sources`,
    artifact.durationSec != null && `${artifact.durationSec}s`,
  ].filter(Boolean) as string[];

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.7s ease, transform 0.7s ease',
      }}
    >
      {(metaPills.length > 0 || (kbId && query)) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {metaPills.map((label) => (
            <span
              key={label}
              style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'rgba(255,255,255,0.45)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '4px 12px',
                borderRadius: '20px',
              }}
            >
              {label}
            </span>
          ))}
          {kbId && query && (
            <div style={{ marginLeft: 'auto' }}>
              <ExportButton kbId={kbId} query={query} />
            </div>
          )}
        </div>
      )}

      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 4px 40px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ padding: '32px 36px' }} data-artifact-content>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em', marginBottom: '6px', lineHeight: 1.3 }}>{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.28)', marginTop: '36px', marginBottom: '14px' }}>
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 style={{ fontSize: '13.5px', fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginTop: '24px', marginBottom: '8px' }}>{children}</h3>
              ),
              p: ({ children }) => (
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.58)', lineHeight: 1.75, marginBottom: '12px' }}>{children}</p>
              ),
              ul: ({ children }) => (
                <ul style={{ margin: '10px 0 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>{children}</ul>
              ),
              li: ({ children }) => (
                <li style={{ display: 'flex', gap: '10px', fontSize: '14px', color: 'rgba(255,255,255,0.58)', lineHeight: 1.65 }}>
                  <span style={{ marginTop: '9px', width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(99,102,241,0.6)', flexShrink: 0 }} />
                  <span>{children}</span>
                </li>
              ),
              strong: ({ children }) => (
                <strong style={{ fontWeight: 600, color: 'rgba(255,255,255,0.78)' }}>{children}</strong>
              ),
              a: ({ href, children }) => (
                <a href={href} style={{ color: 'rgba(129,140,248,0.9)', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer"
                  onMouseEnter={(e) => { (e.target as HTMLElement).style.textDecoration = 'underline'; }}
                  onMouseLeave={(e) => { (e.target as HTMLElement).style.textDecoration = 'none'; }}
                >{children}</a>
              ),
              hr: () => (
                <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '28px 0' }} />
              ),
              code: ({ children }) => (
                <code style={{ fontSize: '12.5px', color: 'rgba(192,132,252,0.9)', background: 'rgba(139,92,246,0.1)', padding: '2px 6px', borderRadius: '5px', fontFamily: 'monospace' }}>{children}</code>
              ),
            }}
          >
            {artifact.rawMarkdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
