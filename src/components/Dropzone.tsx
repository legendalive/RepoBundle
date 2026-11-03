import React, { useState, useRef } from 'react';
import { Upload, FolderArchive, Sparkles, AlertCircle, Cpu, FileCode2, Layers } from 'lucide-react';
import { generateSampleZip } from '../utils/zipBundler';

interface DropzoneProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
  progressPercent: number;
  progressStatus: string;
  errorMessage: string | null;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFileSelected,
  isLoading,
  progressPercent,
  progressStatus,
  errorMessage,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.zip') || file.type.includes('zip')) {
        onFileSelected(file);
      } else {
        alert('Please drop a valid .zip archive file.');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelected(e.target.files[0]);
    }
  };

  const handleLoadSample = async (type: 'fullstack' | 'tslib' | 'stresstest') => {
    if (isLoading) return;
    try {
      const sampleFile = await generateSampleZip(type);
      onFileSelected(sampleFile);
    } catch (err) {
      console.error('Error generating sample zip:', err);
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".zip,application/zip,application/x-zip-compressed"
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
        className={`relative cursor-pointer rounded-2xl border p-10 md:p-14 text-center transition-all duration-200 overflow-hidden ${
          isDragOver
            ? 'border-[#d4a359] bg-[#d4a359]/5 scale-[1.005] shadow-[0_0_30px_rgba(212,163,89,0.12)]'
            : 'border-[#1f2430] bg-gradient-to-b from-[#11141c]/90 to-[#0c0e14]/90 hover:border-[#d4a359]/40 hover:bg-[#131620]'
        }`}
      >
        {/* Subtle radial ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-[#d4a359]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center max-w-lg mx-auto">
          {/* Insignia Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-[#202534] to-[#12151e] border border-[#2c3244] flex items-center justify-center text-[#d4a359] mb-5 shadow-[0_4px_16px_rgba(0,0,0,0.4)]">
            <Upload className="w-7 h-7 stroke-[1.75]" />
          </div>

          <h3 className="text-xl font-bold text-[#f5f1eb] tracking-tight mb-1.5">
            Ingest Codebase Archive
          </h3>
          <p className="text-xs text-stone-400 mb-6 leading-relaxed max-w-md">
            Drop your <span className="font-mono text-stone-300">.zip</span> repository here. RepoBundle isolates all file extensions, compiles clean non-destructive bundles, and produces a complete structural file tree.
          </p>

          <button
            type="button"
            disabled={isLoading}
            className="px-6 py-2.5 text-xs font-semibold text-stone-950 bg-gradient-to-r from-[#e2b76c] to-[#c9944d] hover:from-[#ecc279] hover:to-[#d4a05a] rounded-lg transition-all shadow-[0_2px_12px_rgba(212,163,89,0.22)] mb-3 cursor-pointer"
          >
            Select ZIP Archive
          </button>

          <div className="flex items-center gap-2 text-[11px] text-stone-500 font-medium">
            <span>Zero code alteration</span>
            <span aria-hidden="true">·</span>
            <span>Client-side streaming</span>
            <span aria-hidden="true">·</span>
            <span>100% private in-browser</span>
          </div>
        </div>

        {/* Loading Progress State */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#090a0e]/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 z-20">
            <div className="w-12 h-12 rounded-xl bg-[#d4a359]/15 border border-[#d4a359]/40 flex items-center justify-center text-[#d4a359] mb-3 animate-pulse shadow-[0_0_16px_rgba(212,163,89,0.2)]">
              <FolderArchive className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#f5f1eb] mb-3">{progressStatus}</p>
            <div className="w-80 max-w-full bg-[#181b24] rounded-full h-2 mb-2 overflow-hidden border border-[#252a38]">
              <div
                className="bg-gradient-to-r from-[#d4a359] to-[#ecc279] h-2 rounded-full transition-all duration-200"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-xs font-mono text-stone-400 tabular-nums">{progressPercent}%</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
          <div>
            <div className="font-semibold text-red-200">Processing Failed</div>
            <div className="text-red-300/90 mt-0.5">{errorMessage}</div>
          </div>
        </div>
      )}

      {/* Instant Test Archives Strip */}
      <div className="mt-4 p-4 rounded-xl bg-[#11131a] border border-[#1d212c] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <Sparkles className="w-3.5 h-3.5 text-[#d4a359]" />
          <span>Quick test archives for instant evaluation:</span>
        </div>
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleLoadSample('stresstest')}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#e8c07e] bg-[#221c12] hover:bg-[#2e2617] border border-[#d4a359]/40 rounded-lg transition-colors cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5 text-[#d4a359]" />
            <span>Stress Test (120+ files across nested folders)</span>
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('fullstack')}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-300 bg-[#161922] hover:bg-[#1e222e] hover:text-white border border-[#252b3a] rounded-lg transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-stone-400" />
            <span>Fullstack App (.ts, .jsx, .py, .css)</span>
          </button>
          <button
            type="button"
            onClick={() => handleLoadSample('tslib')}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-300 bg-[#161922] hover:bg-[#1e222e] hover:text-white border border-[#252b3a] rounded-lg transition-colors cursor-pointer"
          >
            <FileCode2 className="w-3.5 h-3.5 text-stone-400" />
            <span>TypeScript Lib (.ts, .json, .md)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
