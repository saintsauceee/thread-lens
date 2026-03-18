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
      className="transition-all duration-700 ease-out"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)' }}
    >
      {(metaPills.length > 0 || (kbId && query)) && (
        <div className="flex items-center gap-2 mb-5">
          {metaPills.map((label) => (
            <span key={label} className="text-[12px] font-medium text-neutral-500 bg-white border border-neutral-200 px-3 py-1 rounded-full shadow-sm">
              {label}
            </span>
          ))}
          {kbId && query && (
            <div className="ml-auto">
              <ExportButton kbId={kbId} query={query} />
            </div>
          )}
        </div>
      )}

      <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-8 py-7 space-y-6" data-artifact-content>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-lg font-semibold text-neutral-900 tracking-tight mb-1">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mt-8 mb-3 first:mt-0">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-[13px] font-semibold text-neutral-700 mt-5 mb-2">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="text-sm text-neutral-600 leading-relaxed">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="space-y-1.5 my-3">{children}</ul>
              ),
              li: ({ children }) => (
                <li className="flex gap-2 text-sm text-neutral-600 leading-relaxed">
                  <span className="mt-[7px] w-1 h-1 rounded-full bg-neutral-300 shrink-0" />
                  <span>{children}</span>
                </li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-neutral-800">{children}</strong>
              ),
              a: ({ href, children }) => (
                <a href={href} className="text-indigo-500 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>
              ),
              hr: () => (
                <hr className="border-neutral-100 my-6" />
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
