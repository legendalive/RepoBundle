import React from 'react';
import { BundlingResult } from '../types/bundler';
import { formatBytes } from '../utils/treeGenerator';
import { FileCode, Folder, Hash, HardDrive, Clock, Check } from 'lucide-react';

interface StatsOverviewProps {
  result: BundlingResult;
  selectedExtension: string;
  onSelectExtension: (ext: string) => void;
}

function getExtensionTagColor(ext: string): { bg: string; text: string; border: string } {
  const clean = ext.toLowerCase().replace(/^\./, '');
  if (['ts', 'tsx'].includes(clean)) {
    return { bg: 'bg-[#d4a359]/15', text: 'text-[#e5ba73]', border: 'border-[#d4a359]/30' };
  }
  if (['js', 'jsx', 'mjs'].includes(clean)) {
    return { bg: 'bg-amber-500/10', text: 'text-amber-300', border: 'border-amber-500/30' };
  }
  if (['py'].includes(clean)) {
    return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  }
  if (['css', 'scss', 'sass'].includes(clean)) {
    return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' };
  }
  if (['html', 'htm'].includes(clean)) {
    return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/30' };
  }
  if (['md', 'markdown'].includes(clean)) {
    return { bg: 'bg-indigo-500/10', text: 'text-indigo-300', border: 'border-indigo-500/30' };
  }
  if (['json', 'yaml', 'yml', 'toml'].includes(clean)) {
    return { bg: 'bg-teal-500/10', text: 'text-teal-300', border: 'border-teal-500/30' };
  }
  return { bg: 'bg-stone-800/40', text: 'text-stone-300', border: 'border-stone-700/40' };
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  result,
  selectedExtension,
  onSelectExtension,
}) => {
  return (
    <div className="space-y-6">
      {/* Primary KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-[#11131a] border border-[#1e222d]">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-400 mb-1">
            <FileCode className="w-3.5 h-3.5 text-[#d4a359]" />
            <span>Total Files</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#f5f1eb]">
            {result.totalFiles.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">all detected types</div>
        </div>

        <div className="p-4 rounded-xl bg-[#11131a] border border-[#1e222d]">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-400 mb-1">
            <Folder className="w-3.5 h-3.5 text-[#cca162]" />
            <span>Directories</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#f5f1eb]">
            {result.totalDirectories.toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">in tree hierarchy</div>
        </div>

        <div className="p-4 rounded-xl bg-[#11131a] border border-[#1e222d]">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-400 mb-1">
            <HardDrive className="w-3.5 h-3.5 text-stone-300" />
            <span>Uncompressed</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#f5f1eb]">
            {formatBytes(result.totalBytes)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">total raw size</div>
        </div>

        <div className="p-4 rounded-xl bg-[#11131a] border border-[#1e222d]">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-400 mb-1">
            <Hash className="w-3.5 h-3.5 text-emerald-400" />
            <span>Extensions</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#f5f1eb]">
            {result.groups.length}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">individual bundles</div>
        </div>

        <div className="p-4 rounded-xl bg-[#11131a] border border-[#1e222d]">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-400 mb-1">
            <HardDrive className="w-3.5 h-3.5 text-[#e0b471]" />
            <span>Bundled Archive</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#f5f1eb]">
            {formatBytes(result.outputZipSize)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">deflated size</div>
        </div>

        <div className="p-4 rounded-xl bg-[#11131a] border border-[#1e222d]">
          <div className="flex items-center gap-2 text-xs font-medium text-stone-400 mb-1">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span>Execution</span>
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#f5f1eb]">
            {result.processingTimeMs} ms
          </div>
          <div className="text-[11px] text-stone-500 mt-1">client processing</div>
        </div>
      </div>

      {/* Extension Bundles Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-semibold text-stone-300 tracking-wider uppercase">
            Detected File Bundles ({result.groups.length})
          </h4>
          <span className="text-xs text-stone-500">
            Select a bundle to preview or copy
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {result.groups.map((group) => {
            const isSelected = selectedExtension === group.extension;
            const tagStyle = getExtensionTagColor(group.extension);
            return (
              <button
                key={group.extension}
                type="button"
                onClick={() => onSelectExtension(group.extension)}
                className={`p-3.5 rounded-xl border text-left transition-all relative cursor-pointer ${
                  isSelected
                    ? 'bg-[#1b1c24] border-[#d4a359] shadow-[0_0_15px_rgba(212,163,89,0.12)] ring-1 ring-[#d4a359]/30'
                    : 'bg-[#11131a] border-[#1e222d] hover:border-[#2d3444] hover:bg-[#141721]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded border ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border}`}>
                    {group.label}
                  </span>
                  <span className="text-xs font-mono tabular-nums text-stone-400">
                    {group.count} {group.count === 1 ? 'file' : 'files'}
                  </span>
                </div>

                <div className="font-mono text-xs text-stone-300 truncate mb-2">
                  {group.bundleFileName}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-stone-500 font-mono tabular-nums">
                  <span>{formatBytes(group.totalBytes)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{group.totalLines > 0 ? `${group.totalLines.toLocaleString()} lines` : 'binary'}</span>
                </div>

                {isSelected && (
                  <div className="absolute top-3 right-3 text-[#d4a359]">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
