import React, { useState } from 'react';
import {
  FolderArchive,
  UploadCloud,
  FileCode2,
  Download,
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCircle2,
  Laptop,
} from 'lucide-react';

export const HowToUseSection: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <section className="rounded-2xl border border-[#1e222d] bg-gradient-to-b from-[#11131a] to-[#0d0e14] overflow-hidden transition-all shadow-[0_2px_16px_rgba(0,0,0,0.35)]">
      {/* Header bar / Toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-5 flex items-center justify-between cursor-pointer hover:bg-[#141722] transition-colors border-b border-[#1b1f2b]"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#d4a359]/15 border border-[#d4a359]/30 flex items-center justify-center text-[#d4a359]">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#f5f1eb] tracking-tight">
              How RepoBundle Works · End-to-End Workflow
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">
              From local folder compression to instant extension-grouped bundles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-400 font-mono">
          <span className="hidden sm:inline">{isOpen ? 'Collapse Guide' : 'Expand Guide'}</span>
          <div className="w-7 h-7 rounded-md bg-[#181c26] border border-[#232938] flex items-center justify-center text-stone-300">
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </div>
      </div>

      {/* Workflow Steps Grid */}
      {isOpen && (
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#1c202a] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-[#d4a359]">
                    01
                  </span>
                  <FolderArchive className="w-4 h-4 text-stone-400" />
                </div>
                <h4 className="text-xs font-bold text-[#f5f1eb] uppercase tracking-wider mb-2">
                  Compress Folder
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Locate your application project folder on your computer and create a <code className="bg-[#181c26] text-stone-200 px-1 py-0.5 rounded font-mono text-[11px]">.zip</code> archive:
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-[#181b24] text-[11px] text-stone-400 font-mono">
                <div className="flex items-start gap-1.5">
                  <span className="text-[#d4a359] shrink-0">Win:</span>
                  <span>Right-click &gt; Compress to ZIP file</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-[#d4a359] shrink-0">Mac:</span>
                  <span>Right-click &gt; Compress "[Folder]"</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#1c202a] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-[#d4a359]">
                    02
                  </span>
                  <UploadCloud className="w-4 h-4 text-[#d4a359]" />
                </div>
                <h4 className="text-xs font-bold text-[#f5f1eb] uppercase tracking-wider mb-2">
                  Automatic Ingestion
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Drag and drop the <code className="bg-[#181c26] text-stone-200 px-1 py-0.5 rounded font-mono text-[11px]">.zip</code> file onto RepoBundle or click <strong>Select ZIP Archive</strong>.
                </p>
              </div>

              <div className="p-2 rounded-lg bg-[#18140c] border border-[#d4a359]/25 text-[11px] text-[#e0b471] leading-tight">
                <strong>Instant Execution:</strong> Extraction, extension sorting, and bundling start automatically on drop. No extra "Convert" button needed.
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#1c202a] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-[#d4a359]">
                    03
                  </span>
                  <FileCode2 className="w-4 h-4 text-stone-400" />
                </div>
                <h4 className="text-xs font-bold text-[#f5f1eb] uppercase tracking-wider mb-2">
                  Inspect & Verify
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Review the interactive directory tree, file sizes, and lines. Select any bundle (e.g. <span className="font-mono text-stone-300">.ts</span>, <span className="font-mono text-stone-300">.py</span>, <span className="font-mono text-stone-300">.css</span>) to preview verbatim code.
                </p>
              </div>

              <div className="space-y-1 pt-2 border-t border-[#181b24] text-[11px] text-stone-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Syntax-aware path headers</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>Auto-generated FILE_TREE.md</span>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl bg-[#0b0c10] border border-[#1c202a] flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-[#d4a359]">
                    04
                  </span>
                  <Download className="w-4 h-4 text-[#d4a359]" />
                </div>
                <h4 className="text-xs font-bold text-[#f5f1eb] uppercase tracking-wider mb-2">
                  Download Archive
                </h4>
                <p className="text-xs text-stone-400 leading-relaxed">
                  Click <strong>Download All Bundles (ZIP)</strong> to export the consolidated package containing all single-extension files and <span className="font-mono text-stone-300">FILE_TREE.md</span>.
                </p>
              </div>

              <div className="pt-2 border-t border-[#181b24] text-[11px] text-stone-400">
                <span>Or use <strong>Copy Full File</strong> for direct 1-click clipboard insertion into LLMs or tools.</span>
              </div>
            </div>
          </div>

          {/* Guarantee Footer Strip inside Guide */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-[#0f1118] border border-[#1b1f2b] text-xs text-stone-400">
            <div className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-[#d4a359]" />
              <span><strong>100% In-Browser Execution:</strong> Zero files leave your device. All decompression and bundling occur locally in memory.</span>
            </div>
            <div className="flex items-center gap-2 text-stone-500 font-mono text-[11px]">
              <span>Zero telemetry</span>
              <span aria-hidden="true">·</span>
              <span>Zero dependencies</span>
              <span aria-hidden="true">·</span>
              <span>Unlimited repository size</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
