'use client';

import { useEffect, useState } from 'react';
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
          { label: '6 agents' },
          { label: `${report.totalSources} sources` },
          { label: `${report.durationSec}s` },
        ].map(({ label }) => (
          <span key={label} className="text-[12px] font-medium text-neutral-500 bg-white border border-neutral-200 px-3 py-1 rounded-full shadow-sm">
            {label}
          </span>
        ))}
      </div>

      {/* Report card */}
      <div className="bg-white border border-neutral-200 rounded-2xl p-7 shadow-sm">
        {/* Title */}
        <h2 className="text-base font-semibold text-neutral-900 mb-4 capitalize">{report.title}</h2>
        <div className="border-t border-neutral-100 mb-6" />
        {/* Summary */}
        <p className="text-sm text-neutral-600 leading-relaxed mb-7">{report.summary}</p>
        <div className="border-t border-neutral-100 mb-7" />

        {/* Sections */}
        <div className="space-y-7">
          {report.sections.map((section) => (
            <div key={section.heading}>
              <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-2">
                {section.heading}
              </h3>
              <p className="text-sm text-neutral-700 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-neutral-100 mt-7 mb-6" />

        {/* Sources */}
        <h3 className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest mb-3">
          Sources
        </h3>
        <ul className="space-y-2">
          {report.sources.map((source, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <span className="text-neutral-300 shrink-0 mt-0.5 text-[11px] font-mono w-4 text-right">
                {i + 1}
              </span>
              <span className="text-neutral-700">{source.label}</span>
              <span className="text-neutral-400 shrink-0">·</span>
              <span className="text-indigo-500 text-[12px] shrink-0">{source.domain}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
