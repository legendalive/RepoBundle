import React from 'react';
import { Archive, Download } from 'lucide-react';

interface HeaderProps {
  onDownloadZip?: () => void;
  hasResult: boolean;
  onReset: () => void;
  activeTab?: string;
  onChangeTab?: (tab: 'preview' | 'tree' | 'raw-markdown') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onDownloadZip,
  hasResult,
  onReset,
  activeTab,
  onChangeTab,
}) => {
  return (
    <header className="flex items-center justify-between gap-6 px-6 py-3.5 border-b border-[#1c202a] bg-[#0c0e13]/95 backdrop-blur-md sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onReset}
          className="flex items-center gap-2.5 text-left group transition-all cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#e0ad64]/20 via-[#c49247]/10 to-transparent border border-[#d4a359]/40 flex items-center justify-center text-[#d4a359] group-hover:border-[#d4a359]/70 group-hover:scale-105 transition-all shadow-[0_0_12px_rgba(212,163,89,0.15)]">
            <Archive className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-[#f4efe8] group-hover:text-white transition-colors">
              RepoBundle
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Navigation Controls */}
      <nav className="flex items-center gap-5 text-xs font-medium text-stone-400">
        <button
          onClick={onReset}
          className="hover:text-[#f4efe8] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Workspace
        </button>

        {hasResult && onChangeTab && (
          <div className="flex items-center gap-1 px-1 py-0.5 rounded-lg bg-[#141720] border border-[#212634]">
            <button
              onClick={() => onChangeTab('preview')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-[#d4a359]/20 text-[#e6b772] font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Bundles
            </button>
            <button
              onClick={() => onChangeTab('tree')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeTab === 'tree'
                  ? 'bg-[#d4a359]/20 text-[#e6b772] font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Hierarchy Tree
            </button>
            <button
              onClick={() => onChangeTab('raw-markdown')}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                activeTab === 'raw-markdown'
                  ? 'bg-[#d4a359]/20 text-[#e6b772] font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              FILE_TREE.md
            </button>
          </div>
        )}
      </nav>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        {hasResult && onDownloadZip && (
          <button
            onClick={onDownloadZip}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-950 bg-gradient-to-r from-[#e2b76c] to-[#c9944d] hover:from-[#ecc279] hover:to-[#d4a05a] rounded-lg transition-all shadow-[0_2px_10px_rgba(212,163,89,0.25)] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Download All Bundles (ZIP)</span>
          </button>
        )}
      </div>
    </header>
  );
};
