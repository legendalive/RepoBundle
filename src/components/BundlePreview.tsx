import React, { useState } from 'react';
import { BundlingResult } from '../types/bundler';
import { formatBytes } from '../utils/treeGenerator';
import { downloadBlob, getFullGroupContent } from '../utils/zipBundler';
import { Copy, Check, Download, FileText, FileCode, Info, AlertTriangle } from 'lucide-react';

interface BundlePreviewProps {
  result: BundlingResult;
  selectedExtension: string;
  onSelectExtension: (ext: string) => void;
  onDownloadZip: () => void;
}

export const BundlePreview: React.FC<BundlePreviewProps> = ({
  result,
  selectedExtension,
  onSelectExtension,
  onDownloadZip,
}) => {
  const [activeTab, setActiveTab] = useState<'bundle' | 'markdown'>('bundle');
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);

  const currentGroup = result.groups.find((g) => g.extension === selectedExtension) || result.groups[0];

  const contentToDisplay = activeTab === 'markdown'
    ? result.markdownTree
    : (currentGroup ? currentGroup.previewContent : '');

  const displayFileName = activeTab === 'markdown'
    ? 'FILE_TREE.md'
    : (currentGroup ? currentGroup.bundleFileName : '');

  const handleCopy = async () => {
    if (copying) return;
    setCopying(true);
    try {
      if (activeTab === 'markdown') {
        await navigator.clipboard.writeText(result.markdownTree);
      } else if (currentGroup) {
        const fullText = await getFullGroupContent(currentGroup);
        await navigator.clipboard.writeText(fullText);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy full text to clipboard:', err);
    } finally {
      setCopying(false);
    }
  };

  const handleDownloadSingle = () => {
    if (activeTab === 'markdown') {
      const blob = new Blob([result.markdownTree], { type: 'text/markdown;charset=utf-8' });
      downloadBlob(blob, 'FILE_TREE.md');
    } else if (currentGroup) {
      downloadBlob(currentGroup.fullBlob, currentGroup.bundleFileName);
    }
  };

  return (
    <div className="rounded-xl border border-[#1e222d] bg-[#11131a] flex flex-col h-full overflow-hidden">
      {/* Top Bar with Tabs and Actions */}
      <div className="p-3.5 border-b border-[#1e222d] bg-[#0d0f15]/90 flex flex-wrap items-center justify-between gap-4">
        {/* Tab Selector */}
        <div className="flex items-center gap-1 bg-[#161922] p-1 rounded-lg border border-[#252a38]">
          <button
            type="button"
            onClick={() => setActiveTab('bundle')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'bundle'
                ? 'bg-[#d4a359] text-stone-950 shadow-sm font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Bundled Code ({currentGroup?.label || ''})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('markdown')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === 'markdown'
                ? 'bg-[#d4a359] text-stone-950 shadow-sm font-bold'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>FILE_TREE.md</span>
          </button>
        </div>

        {/* Extension Dropdown */}
        {activeTab === 'bundle' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 font-mono">Bundle:</span>
            <select
              value={selectedExtension}
              onChange={(e) => onSelectExtension(e.target.value)}
              className="bg-[#161922] border border-[#262c3c] rounded-lg px-2.5 py-1.5 text-xs text-stone-200 font-mono focus:outline-none focus:border-[#d4a359]/70 cursor-pointer"
            >
              {result.groups.map((g) => (
                <option key={g.extension} value={g.extension}>
                  {g.bundleFileName} ({g.count} {g.count === 1 ? 'file' : 'files'})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Actions: Copy & Downloads */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={handleCopy}
            disabled={copying}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-300 bg-[#1a1e28] hover:bg-[#232836] hover:text-white border border-[#272e3f] rounded-lg transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Full File Copied!</span>
              </>
            ) : copying ? (
              <span className="text-stone-400">Copying...</span>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#d4a359]" />
                <span>Copy Full File</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadSingle}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-300 bg-[#1a1e28] hover:bg-[#232836] hover:text-white border border-[#272e3f] rounded-lg transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-stone-400" />
            <span>Save {displayFileName}</span>
          </button>
        </div>
      </div>

      {/* Truncation notice for huge bundles in DOM viewer */}
      {activeTab === 'bundle' && currentGroup?.isTruncatedInPreview && (
        <div className="px-4 py-2 bg-amber-950/30 border-b border-amber-800/40 flex items-center gap-2 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#d4a359]" />
          <span>
            Large Bundle Safeguard: Initial section shown in DOM viewer for smooth scrolling. <strong>100% of all {currentGroup.files.length} files ({formatBytes(currentGroup.totalBytes)})</strong> are fully preserved in the downloaded file and clipboard copy.
          </span>
        </div>
      )}

      {/* Info strip */}
      <div className="px-4 py-2 bg-[#0c0e14] border-b border-[#1b1f2b] flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400">
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-stone-200 font-semibold">{displayFileName}</span>
          <span aria-hidden="true" className="text-stone-600">·</span>
          <span>
            {activeTab === 'markdown'
              ? `${result.markdownTree.split('\n').length.toLocaleString()} lines`
              : `${currentGroup?.files.length} files · ${currentGroup?.totalLines.toLocaleString()} lines`}
          </span>
          <span aria-hidden="true" className="text-stone-600">·</span>
          <span>
            {activeTab === 'markdown'
              ? formatBytes(new Blob([result.markdownTree]).size)
              : formatBytes(currentGroup?.totalBytes || 0)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 font-mono">
          <Info className="w-3.5 h-3.5 text-[#d4a359]" />
          <span>Verbatim concatenation · Zero alterations</span>
        </div>
      </div>

      {/* Code Text Viewer */}
      <div className="flex-1 relative overflow-hidden bg-[#090a0e]">
        <pre className="p-4 overflow-auto max-h-[520px] font-mono text-xs text-stone-300 leading-relaxed whitespace-pre selection:bg-[#d4a359] selection:text-stone-950">
          {contentToDisplay || '// No content in this bundle.'}
        </pre>
      </div>

      {/* Bottom Download CTA Bar */}
      <div className="p-4 border-t border-[#1e222d] bg-[#0e1017] flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-stone-400">
          Ready to export? All <span className="font-mono text-[#f5f1eb] font-semibold">{result.groups.length}</span> bundles and <span className="font-mono text-[#f5f1eb] font-semibold">FILE_TREE.md</span> packaged into a single archive.
        </div>
        <button
          type="button"
          onClick={onDownloadZip}
          className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-stone-950 bg-gradient-to-r from-[#e2b76c] to-[#c9944d] hover:from-[#ecc279] hover:to-[#d4a05a] rounded-lg transition-all shadow-[0_2px_12px_rgba(212,163,89,0.22)] ml-auto cursor-pointer"
        >
          <Download className="w-4 h-4 stroke-[2.5]" />
          <span>Download All Bundles (ZIP Archive)</span>
        </button>
      </div>
    </div>
  );
};
