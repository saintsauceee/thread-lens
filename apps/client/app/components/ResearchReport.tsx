'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ResearchReport as ReportData } from '../lib/simulationData';

export default function ResearchReport({ report }: { report: ReportData }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className="transition-all duration-700 ease-out"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)' }}
    >
      {/* Stats bar */}
      <div className="flex items-center gap-2 mb-5">
        {[
          `${report.agentCount} agents`,
          `${report.sourceCount} sources`,
          `${report.durationSec}s`,
        ].map((label) => (
          <span key={label} className="text-[12px] font-medium text-neutral-500 bg-white border border-neutral-200 px-3 py-1 rounded-full shadow-sm">
            {label}
          </span>
        ))}
      </div>

      {/* Report card */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-7 shadow-sm">
        <div className="prose prose-sm max-w-none
          prose-headings:font-semibold prose-headings:text-neutral-900
          prose-h1:text-base prose-h1:mb-4
          prose-h2:text-[13px] prose-h2:uppercase prose-h2:tracking-widest prose-h2:text-neutral-400 prose-h2:font-semibold prose-h2:mt-7 prose-h2:mb-2
          prose-h3:text-[11px] prose-h3:uppercase prose-h3:tracking-widest prose-h3:text-neutral-400 prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-2
          prose-p:text-sm prose-p:text-neutral-700 prose-p:leading-relaxed
          prose-li:text-sm prose-li:text-neutral-700 prose-li:leading-relaxed
          prose-a:text-indigo-500 prose-a:no-underline hover:prose-a:underline
          prose-hr:border-neutral-100
          prose-strong:text-neutral-900
        ">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {report.rawMarkdown}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
