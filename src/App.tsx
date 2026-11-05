import React, { useState } from 'react';
import { BundlingResult } from './types/bundler';
import { processZipFile, downloadBlob } from './utils/zipBundler';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { StatsOverview } from './components/StatsOverview';
import { FileTreeViewer } from './components/FileTreeViewer';
import { BundlePreview } from './components/BundlePreview';
import { HowToUseSection } from './components/HowToUseSection';
import { SponsorAd } from './components/SponsorAd';
import {
  ShieldCheck,
  FileText,
  FileCode,
  FolderTree,
  Download,
  RotateCcw,
  Archive,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<BundlingResult | null>(null);
  const [selectedExtension, setSelectedExtension] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'codebase' | 'preview' | 'tree' | 'raw-markdown'>('codebase');

  const handleProcessFile = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    setProgressPercent(5);
    setProgressStatus('Initializing extraction container...');

    try {
      const res = await processZipFile(file, file.name, (pct, status) => {
        setProgressPercent(pct);
        setProgressStatus(status);
      });

      setResult(res);
      if (res.groups.length > 0) {
        setSelectedExtension(res.groups[0].extension);
      }
      setActiveTab('codebase');
    } catch (err: any) {
      console.error('Extraction error:', err);
      setErrorMessage(
        err?.message || 'Failed to read or bundle the ZIP file. Please ensure it is a valid zip archive.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAllZip = () => {
    if (!result || !result.outputZipBlob) return;
    const cleanName = result.archiveName.replace(/\.zip$/i, '');
    downloadBlob(result.outputZipBlob, `${cleanName}_bundled.zip`);
  };

  const handleDownloadCodebase = () => {
    if (!result || !result.fullCodebaseBlob) return;
    downloadBlob(result.fullCodebaseBlob, 'CODEBASE.md');
  };

  const handleReset = () => {
    setResult(null);
    setErrorMessage(null);
    setProgressPercent(0);
    setProgressStatus('');
  };

  return (
    <div className="min-h-screen bg-[#090a0d] text-stone-100 flex flex-col font-sans selection:bg-[#d4a359] selection:text-stone-950">
      {/* Top Bar Header */}
      <Header
        onDownloadZip={handleDownloadAllZip}
        onDownloadCodebase={handleDownloadCodebase}
        hasResult={!!result}
        onReset={handleReset}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-7">
        {/* Zero Code Alteration Guarantee Banner */}
        <section className="rounded-xl border border-[#2d2417] bg-gradient-to-r from-[#17140e] via-[#12110d] to-[#17140e] p-4 flex items-center justify-between gap-4 shadow-[0_2px_12px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-[#d4a359]/15 border border-[#d4a359]/35 flex items-center justify-center text-[#d4a359] shrink-0 shadow-[0_0_12px_rgba(212,163,89,0.15)]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#e6b976]">
                Zero Code Alteration Guarantee
              </h2>
              <p className="text-xs text-stone-400 mt-0.5">
                Every file is bundled 100% verbatim. Zero lines added, transpiled, or deleted. Clean comment headers designate original relative file paths.
              </p>
            </div>
          </div>
        </section>

        {/* Upload Dropzone (shown on empty state or collapsible above results) */}
        {!result ? (
          <div className="space-y-7 py-2">
            <Dropzone
              onFileSelected={handleProcessFile}
              isLoading={isLoading}
              progressPercent={progressPercent}
              progressStatus={progressStatus}
              errorMessage={errorMessage}
            />

            {/* How to Use Section */}
            <HowToUseSection />
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Active Archive Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-[#11131a] border border-[#1e222d] shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-[#d4a359]/15 border border-[#d4a359]/30 text-[#d4a359] flex items-center justify-center font-mono text-xs font-bold">
                  <Archive className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#f5f1eb]">
                      {result.archiveName}
                    </span>
                    <span className="text-stone-600">·</span>
                    <span className="text-xs text-emerald-400 font-medium">Bundled Successfully</span>
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5 font-mono tabular-nums">
                    {result.totalFiles.toLocaleString()} files detected · CODEBASE.md ready for AI ingestion
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-stone-300 hover:text-white bg-[#181c26] hover:bg-[#202534] border border-[#242b3a] rounded-lg transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-stone-400" />
                  <span>Upload Another ZIP</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCodebase}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-200 bg-[#171b26] hover:bg-[#222736] hover:text-white border border-[#2b3345] rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-[#d4a359]" />
                  <span>Download CODEBASE.md (For AI)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadAllZip}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-950 bg-gradient-to-r from-[#e2b76c] to-[#c9944d] hover:from-[#ecc279] hover:to-[#d4a05a] rounded-lg transition-all shadow-[0_2px_12px_rgba(212,163,89,0.22)] cursor-pointer"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Download Bundled ZIP</span>
                </button>
              </div>
            </div>

            {/* Metrics and Extension Overview */}
            <StatsOverview
              result={result}
              selectedExtension={selectedExtension}
              onSelectExtension={(ext) => {
                setSelectedExtension(ext);
                setActiveTab('preview');
              }}
            />

            {/* Main Interactive Split: File Tree & Bundled Code View */}
            <div className="space-y-4">
              {/* View Switcher Controls */}
              <div className="flex items-center justify-between gap-4 border-b border-[#1e222d] pb-3">
                <div className="flex flex-wrap items-center gap-1 bg-[#12141c] p-1 rounded-lg border border-[#1e2330]">
                  <button
                    type="button"
                    onClick={() => setActiveTab('codebase')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      activeTab === 'codebase'
                        ? 'bg-gradient-to-r from-[#d4a359] to-[#c79449] text-stone-950 shadow-sm font-bold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>CODEBASE.md (Full Codebase for AI)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('preview')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      activeTab === 'preview'
                        ? 'bg-[#d4a359] text-stone-950 shadow-sm font-bold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5" />
                    <span>Bundled File Inspector</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('tree')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      activeTab === 'tree'
                        ? 'bg-[#d4a359] text-stone-950 shadow-sm font-bold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    <span>Initial Hierarchy Tree</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('raw-markdown')}
                    className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      activeTab === 'raw-markdown'
                        ? 'bg-[#d4a359] text-stone-950 shadow-sm font-bold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>FILE_TREE.md</span>
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500 font-mono">
                  <span>Bundles: {result.groups.length}</span>
                  <span aria-hidden="true">·</span>
                  <span>Ready to export</span>
                </div>
              </div>

              {/* View Content */}
              {activeTab === 'codebase' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-4 h-[640px]">
                    <FileTreeViewer
                      rootNode={result.rootTreeNode}
                      archiveName={result.archiveName}
                    />
                  </div>
                  <div className="lg:col-span-8 h-[640px]">
                    <BundlePreview
                      result={result}
                      selectedExtension={selectedExtension}
                      onSelectExtension={setSelectedExtension}
                      onDownloadZip={handleDownloadAllZip}
                      initialTab="codebase"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <div className="lg:col-span-4 h-[640px]">
                    <FileTreeViewer
                      rootNode={result.rootTreeNode}
                      archiveName={result.archiveName}
                    />
                  </div>
                  <div className="lg:col-span-8 h-[640px]">
                    <BundlePreview
                      result={result}
                      selectedExtension={selectedExtension}
                      onSelectExtension={setSelectedExtension}
                      onDownloadZip={handleDownloadAllZip}
                      initialTab="bundle"
                    />
                  </div>
                </div>
              )}

              {activeTab === 'tree' && (
                <div className="h-[640px]">
                  <FileTreeViewer
                    rootNode={result.rootTreeNode}
                    archiveName={result.archiveName}
                  />
                </div>
              )}

              {activeTab === 'raw-markdown' && (
                <div className="h-[640px]">
                  <BundlePreview
                    result={result}
                    selectedExtension={selectedExtension}
                    onSelectExtension={setSelectedExtension}
                    onDownloadZip={handleDownloadAllZip}
                    initialTab="markdown"
                  />
                </div>
              )}
            </div>

            {/* How to Use Section (collapsible below results for reference) */}
            <HowToUseSection />
          </div>
        )}

        {/* Developer Sponsor / Partner Placement */}
        <SponsorAd />
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1e28] py-6 px-6 bg-[#07080b] text-xs text-stone-500">
        <div className="max-w-7xl mx-auto flex items-center justify-center text-center">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-300">RepoBundle</span>
            <span aria-hidden="true" className="text-stone-700">·</span>
            <span>A Product of LegendAlive Studio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
