import JSZip from 'jszip';
import { ZipEntryItem, ExtensionGroup, BundlingResult } from '../types/bundler';
import { formatFileHeader } from './commentDelimiters';
import { buildTreeHierarchy, buildCompleteAsciiTree, generateMarkdownReport, formatBytes } from './treeGenerator';

// Known binary extensions
const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'bmp', 'tiff', 'svgz',
  'mp4', 'webm', 'mov', 'avi', 'mp3', 'wav', 'ogg', 'flac',
  'pdf', 'zip', 'tar', 'gz', 'bz2', '7z', 'rar', 'wasm',
  'woff', 'woff2', 'ttf', 'eot', 'otf',
  'exe', 'dll', 'so', 'dylib', 'bin', 'iso', 'pyc', 'class'
]);

// Language identifier mappings for markdown code fences in CODEBASE.md
const EXTENSION_TO_LANG: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  mjs: 'javascript',
  cjs: 'javascript',
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  h: 'c',
  hpp: 'cpp',
  cs: 'csharp',
  html: 'html',
  htm: 'html',
  css: 'css',
  scss: 'scss',
  sass: 'sass',
  less: 'less',
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
  sql: 'sql',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  md: 'markdown',
  markdown: 'markdown',
  xml: 'xml',
  svg: 'xml',
  php: 'php',
  rb: 'ruby',
  swift: 'swift',
  kt: 'kotlin',
  kts: 'kotlin',
  dart: 'dart',
  lua: 'lua',
  r: 'r',
  toml: 'toml',
  ini: 'ini',
  dockerfile: 'dockerfile',
  env: 'dotenv',
};

// Maximum characters kept in memory specifically for UI DOM preview to prevent browser freezes
const MAX_PREVIEW_CHARS = 180_000;

function isBinaryFile(path: string, buffer?: Uint8Array): boolean {
  const parts = path.split('.');
  const ext = parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  if (BINARY_EXTENSIONS.has(ext)) return true;

  if (buffer && buffer.length > 0) {
    const checkLength = Math.min(buffer.length, 1024);
    for (let i = 0; i < checkLength; i++) {
      if (buffer[i] === 0) return true;
    }
  }
  return false;
}

function normalizeExtension(path: string): string {
  const fileName = path.split('/').pop() || path;
  if (fileName.startsWith('.') && !fileName.slice(1).includes('.')) {
    return fileName.slice(1).toLowerCase();
  }
  const parts = fileName.split('.');
  if (parts.length > 1) {
    return parts.pop()!.toLowerCase();
  }
  return 'no-extension';
}

function decodeText(buffer: Uint8Array): string {
  try {
    const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
    return utf8Decoder.decode(buffer);
  } catch {
    try {
      const fallbackDecoder = new TextDecoder('windows-1252', { fatal: false });
      return fallbackDecoder.decode(buffer);
    } catch {
      return '';
    }
  }
}

/**
 * Determines a safe markdown backtick fence that will not collide with backticks inside code content.
 */
function getSafeCodeFence(content: string): string {
  let fence = '```';
  while (content.includes(fence)) {
    fence += '`';
  }
  return fence;
}

/**
 * Yield execution to browser event loop to prevent UI lockup during large archive processing.
 */
function yieldToEventLoop(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

interface RawExtractedEntry {
  path: string;
  name: string;
  extension: string;
  size: number;
  isBinary: boolean;
  lineCount: number;
  buffer: Uint8Array;
}

/**
 * Hardened processor for large codebases.
 * Handles thousands of files without UI thread freezes or memory crashes.
 */
export async function processZipFile(
  fileData: File | ArrayBuffer,
  fileName: string,
  onProgress?: (percent: number, status: string) => void
): Promise<BundlingResult> {
  const startTime = performance.now();
  onProgress?.(5, 'Opening archive container...');

  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(fileData);

  const fileKeys = Object.keys(loadedZip.files);
  const totalEntries = fileKeys.length;
  onProgress?.(10, `Cataloging ${totalEntries.toLocaleString()} items in archive...`);

  // Group files by extension immediately during extraction
  const extensionMap = new Map<string, RawExtractedEntry[]>();
  const lightweightEntries: ZipEntryItem[] = [];
  const allExtractedEntries: RawExtractedEntry[] = [];
  let totalDirectories = 0;
  let totalBytes = 0;
  let totalCodeLines = 0;

  for (let i = 0; i < totalEntries; i++) {
    const relativePath = fileKeys[i];
    const zipObj = loadedZip.files[relativePath];

    // Periodically yield to browser to prevent UI lockups and report progress
    if (i % 25 === 0 || i === totalEntries - 1) {
      const pct = 10 + Math.floor((i / totalEntries) * 40);
      onProgress?.(pct, `Reading entry ${i + 1} of ${totalEntries} (${relativePath})...`);
      await yieldToEventLoop();
    }

    if (zipObj.dir) {
      totalDirectories++;
      continue;
    }

    const uint8Array = await zipObj.async('uint8array');
    const isBinary = isBinaryFile(relativePath, uint8Array);
    const ext = normalizeExtension(relativePath);
    const size = uint8Array.length;
    totalBytes += size;

    let lineCount = 0;
    if (!isBinary) {
      // Fast line count without creating multiple huge string allocations
      let count = 0;
      for (let b = 0; b < uint8Array.length; b++) {
        if (uint8Array[b] === 10) count++; // newline \n
      }
      lineCount = uint8Array.length > 0 ? count + 1 : 0;
      totalCodeLines += lineCount;
    }

    const rawEntry: RawExtractedEntry = {
      path: relativePath,
      name: relativePath.split('/').pop() || relativePath,
      extension: ext,
      size,
      isBinary,
      lineCount,
      buffer: uint8Array,
    };

    allExtractedEntries.push(rawEntry);

    if (!extensionMap.has(ext)) {
      extensionMap.set(ext, []);
    }
    extensionMap.get(ext)!.push(rawEntry);

    lightweightEntries.push({
      path: relativePath,
      name: rawEntry.name,
      extension: ext,
      size,
      isDirectory: false,
      lineCount,
      isBinary,
    });
  }

  onProgress?.(55, 'Building visual directory tree and hierarchy metrics...');
  await yieldToEventLoop();

  const cleanArchiveBase = fileName.replace(/\.zip$/i, '');
  const rootNode = buildTreeHierarchy(lightweightEntries, cleanArchiveBase);
  const asciiTree = buildCompleteAsciiTree(rootNode);

  // Sort all extracted files alphabetically by relative path for consistent reading order
  allExtractedEntries.sort((a, b) => a.path.localeCompare(b.path));

  onProgress?.(65, 'Generating unified CODEBASE.md for AI context (100% verbatim)...');
  await yieldToEventLoop();

  // Assemble CODEBASE.md chunk-by-chunk to handle large repositories with low memory footprint
  const codebaseChunks: string[] = [];
  let fullCodebasePreview = '';
  let isFullCodebaseTruncated = false;

  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const codebaseHeader = `# Repository Codebase: ${fileName}

> Ingestion and AI context package generated on ${timestamp} UTC by RepoBundle.
> Contains 100% verbatim, unedited source code across all files and complete directory hierarchy.
> Designed for direct input into AI models (Claude, ChatGPT, Gemini, etc.) for debugging, code review, and architectural analysis.

## Repository Overview
- **Source Archive**: \`${fileName}\`
- **Total Files**: ${lightweightEntries.length.toLocaleString()}
- **Total Directories**: ${totalDirectories.toLocaleString()}
- **Total Uncompressed Size**: ${formatBytes(totalBytes)} (${totalBytes.toLocaleString()} bytes)
- **Total Code Lines**: ${totalCodeLines.toLocaleString()}
- **File Types**: ${extensionMap.size} unique extensions

## Directory Hierarchy & File Tree
\`\`\`text
${asciiTree}
\`\`\`

## Codebase Files
`;

  codebaseChunks.push(codebaseHeader);
  fullCodebasePreview += codebaseHeader;

  const totalFilesToBundle = allExtractedEntries.length;
  for (let fIdx = 0; fIdx < totalFilesToBundle; fIdx++) {
    const entry = allExtractedEntries[fIdx];

    if (fIdx % 25 === 0) {
      const pct = 65 + Math.floor((fIdx / totalFilesToBundle) * 15);
      onProgress?.(pct, `Compiling AI context: file ${fIdx + 1}/${totalFilesToBundle} (${entry.name})...`);
      await yieldToEventLoop();
    }

    if (entry.isBinary) {
      const binaryNotice = `\n---\n\n### File: \`${entry.path}\`\n\n*(Binary file · ${formatBytes(entry.size)} · Raw binary content omitted for LLM token efficiency)*\n`;
      codebaseChunks.push(binaryNotice);

      if (!isFullCodebaseTruncated) {
        if (fullCodebasePreview.length + binaryNotice.length < MAX_PREVIEW_CHARS) {
          fullCodebasePreview += binaryNotice;
        } else {
          isFullCodebaseTruncated = true;
          fullCodebasePreview += '\n\n... [PREVIEW TRUNCATED IN DOM VIEWER FOR BROWSER PERFORMANCE · 100% VERBATIM CODE IS PRESERVED IN CODEBASE.MD DOWNLOAD AND FULL CLIPBOARD COPY] ...\n';
        }
      }
    } else {
      const text = decodeText(entry.buffer);
      const fence = getSafeCodeFence(text);
      const lang = EXTENSION_TO_LANG[entry.extension] || entry.extension || '';
      
      const fileHeader = `\n---\n\n### File: \`${entry.path}\`\n${fence}${lang}\n`;
      const fileFooter = text.endsWith('\n') ? `${fence}\n` : `\n${fence}\n`;

      codebaseChunks.push(fileHeader);
      codebaseChunks.push(text);
      codebaseChunks.push(fileFooter);

      if (!isFullCodebaseTruncated) {
        const fullBlockLength = fileHeader.length + text.length + fileFooter.length;
        if (fullCodebasePreview.length + fullBlockLength < MAX_PREVIEW_CHARS) {
          fullCodebasePreview += fileHeader + text + fileFooter;
        } else {
          const remainingSpace = Math.max(0, MAX_PREVIEW_CHARS - fullCodebasePreview.length);
          fullCodebasePreview += (fileHeader + text).substring(0, remainingSpace) + '\n\n... [PREVIEW TRUNCATED IN DOM VIEWER FOR BROWSER PERFORMANCE · 100% VERBATIM CODE IS PRESERVED IN CODEBASE.MD DOWNLOAD AND FULL CLIPBOARD COPY] ...\n';
          isFullCodebaseTruncated = true;
        }
      }
    }
  }

  const fullCodebaseBlob = new Blob(codebaseChunks, { type: 'text/markdown;charset=utf-8' });

  onProgress?.(80, 'Consolidating files by extension (100% unaltered verbatim code)...');
  await yieldToEventLoop();

  const groups: ExtensionGroup[] = [];
  const outputZip = new JSZip();

  // Add the unified CODEBASE.md into the output ZIP archive as well
  outputZip.file('CODEBASE.md', fullCodebaseBlob);

  // Sort groups by total file count descending
  const sortedExtensions = Array.from(extensionMap.keys()).sort((a, b) => {
    return extensionMap.get(b)!.length - extensionMap.get(a)!.length;
  });

  const totalGroups = sortedExtensions.length;

  for (let gIdx = 0; gIdx < totalGroups; gIdx++) {
    const ext = sortedExtensions[gIdx];
    const items = extensionMap.get(ext)!;

    // Sort items alphabetically by path
    items.sort((a, b) => a.path.localeCompare(b.path));

    const totalGroupBytes = items.reduce((acc, curr) => acc + curr.size, 0);
    const totalGroupLines = items.reduce((acc, curr) => acc + curr.lineCount, 0);
    const hasBinary = items.some((item) => item.isBinary);

    let bundleFileName = ext === 'no-extension' ? 'bundle_no_extension.txt' : `bundle_${ext}.${ext}`;
    const blobParts: string[] = [];
    let previewBuffer = '';
    let isTruncated = false;

    if (!hasBinary) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const header = formatFileHeader(item.path, ext, i, items.length);
        const text = decodeText(item.buffer);

        blobParts.push(header);
        blobParts.push(text);
        if (!text.endsWith('\n')) {
          blobParts.push('\n');
        }
        blobParts.push('\n');

        // Accumulate preview up to safety cap
        if (!isTruncated) {
          if (previewBuffer.length + header.length + text.length < MAX_PREVIEW_CHARS) {
            previewBuffer += header + text + (text.endsWith('\n') ? '\n\n' : '\n\n\n');
          } else {
            const remainingSpace = Math.max(0, MAX_PREVIEW_CHARS - previewBuffer.length);
            previewBuffer += (header + text).substring(0, remainingSpace) + '\n\n... [PREVIEW TRUNCATED IN UI VIEWER FOR PERFORMANCE · 100% VERBATIM CODE IS PRESERVED IN DOWNLOADABLE ZIP] ...';
            isTruncated = true;
          }
        }
      }

      const fullBlob = new Blob(blobParts, { type: 'text/plain;charset=utf-8' });
      outputZip.file(bundleFileName, fullBlob);

      groups.push({
        extension: ext,
        label: ext === 'no-extension' ? 'No Extension' : `.${ext}`,
        bundleFileName,
        count: items.length,
        totalBytes: totalGroupBytes,
        totalLines: totalGroupLines,
        files: items.map((it) => ({
          path: it.path,
          name: it.name,
          extension: it.extension,
          size: it.size,
          isDirectory: false,
          lineCount: it.lineCount,
          isBinary: it.isBinary,
        })),
        previewContent: previewBuffer,
        isTruncatedInPreview: isTruncated,
        fullBlob,
        isBinary: false,
      });
    } else {
      bundleFileName = `binaries_${ext}.manifest.txt`;
      const manifestLines = [
        `# Binary Bundle Manifest for extension: .${ext}`,
        `# Total binary files: ${items.length}`,
        `# Total size: ${totalGroupBytes} bytes`,
        `# Individual files are preserved under binary_${ext}/ in this archive.\n`,
      ];
      items.forEach((item) => {
        manifestLines.push(`- ${item.path} (${item.size} bytes)`);
        outputZip.file(`binary_${ext}/${item.path.replace(/\//g, '_')}`, item.buffer);
      });
      const manifestContent = manifestLines.join('\n');
      const fullBlob = new Blob([manifestContent], { type: 'text/plain;charset=utf-8' });
      outputZip.file(bundleFileName, fullBlob);

      groups.push({
        extension: ext,
        label: ext === 'no-extension' ? 'No Extension' : `.${ext}`,
        bundleFileName,
        count: items.length,
        totalBytes: totalGroupBytes,
        totalLines: 0,
        files: items.map((it) => ({
          path: it.path,
          name: it.name,
          extension: it.extension,
          size: it.size,
          isDirectory: false,
          lineCount: 0,
          isBinary: true,
        })),
        previewContent: manifestContent,
        isTruncatedInPreview: false,
        fullBlob,
        isBinary: true,
      });
    }

    if (gIdx % 3 === 0) {
      const pct = 80 + Math.floor((gIdx / totalGroups) * 10);
      onProgress?.(pct, `Bundling ${ext} (${gIdx + 1}/${totalGroups})...`);
      await yieldToEventLoop();
    }
  }

  onProgress?.(90, 'Composing FILE_TREE.md markdown report...');
  await yieldToEventLoop();

  const markdownTree = generateMarkdownReport(
    fileName,
    lightweightEntries.length,
    totalDirectories,
    totalBytes,
    groups,
    asciiTree
  );

  outputZip.file('FILE_TREE.md', markdownTree);

  onProgress?.(95, 'Packaging deflated output ZIP archive...');
  await yieldToEventLoop();

  const outputZipBlob = await outputZip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const endTime = performance.now();
  onProgress?.(100, 'Bundling complete!');

  return {
    archiveName: fileName,
    totalFiles: lightweightEntries.length,
    totalDirectories,
    totalBytes,
    groups,
    markdownTree,
    rootTreeNode: rootNode,
    outputZipBlob,
    outputZipSize: outputZipBlob.size,
    processingTimeMs: Math.round(endTime - startTime),
    // Unified single-file Codebase Markdown for AI context
    fullCodebaseBlob,
    fullCodebasePreview,
    isFullCodebaseTruncatedInPreview: isFullCodebaseTruncated,
    fullCodebaseSize: fullCodebaseBlob.size,
    fullCodebaseTotalLines: totalCodeLines,
  };
}

/**
 * Reads the full text of an ExtensionGroup on demand (for one-click copying full files without keeping strings in React state).
 */
export async function getFullGroupContent(group: ExtensionGroup): Promise<string> {
  return group.fullBlob.text();
}

/**
 * Generates test archives including a high-volume Stress Test codebase.
 */
export async function generateSampleZip(
  type: 'fullstack' | 'tslib' | 'stresstest' = 'fullstack'
): Promise<File> {
  const zip = new JSZip();

  if (type === 'stresstest') {
    // 120+ files across complex nested architectures
    const componentNames = [
      'Button', 'Card', 'Modal', 'Drawer', 'Input', 'Select', 'Checkbox', 'Table',
      'Pagination', 'Tooltip', 'Badge', 'Tabs', 'Accordion', 'Alert', 'Avatar',
      'Breadcrumb', 'Calendar', 'Dropdown', 'Menu', 'Navbar', 'Sidebar', 'Skeleton'
    ];

    // Frontend Components
    componentNames.forEach((name) => {
      zip.file(
        `frontend/components/${name}/${name}.tsx`,
        `import React from 'react';\n\nexport interface ${name}Props {\n  id?: string;\n  className?: string;\n  children?: React.ReactNode;\n}\n\nexport const ${name}: React.FC<${name}Props> = ({ children, className }) => {\n  return <div className={className}>{children}</div>;\n};\n`
      );
      zip.file(
        `frontend/components/${name}/${name}.test.tsx`,
        `import { render } from '@testing-library/react';\nimport { ${name} } from './${name}';\n\ntest('renders ${name}', () => {\n  const { container } = render(<${name}>Test</${name}>);\n  expect(container).toBeDefined();\n});\n`
      );
      zip.file(
        `frontend/components/${name}/${name}.module.css`,
        `.${name.toLowerCase()} {\n  display: flex;\n  position: relative;\n  box-sizing: border-box;\n}\n`
      );
    });

    // Backend Services
    const serviceNames = ['Auth', 'User', 'Payment', 'Inventory', 'Notification', 'Analytics', 'Webhook', 'Audit'];
    serviceNames.forEach((svc) => {
      zip.file(
        `backend/services/${svc.toLowerCase()}.service.ts`,
        `export class ${svc}Service {\n  private isReady = true;\n  async execute(payload: any) {\n    return { service: '${svc}', timestamp: Date.now(), success: true };\n  }\n}\n`
      );
      zip.file(
        `backend/controllers/${svc.toLowerCase()}.controller.ts`,
        `import { ${svc}Service } from '../services/${svc.toLowerCase()}.service';\n\nexport class ${svc}Controller {\n  constructor(private service = new ${svc}Service()) {}\n  async handle(req: any, res: any) {\n    const result = await this.service.execute(req.body);\n    res.json(result);\n  }\n}\n`
      );
      zip.file(
        `backend/models/${svc.toLowerCase()}.model.py`,
        `from pydantic import BaseModel\nfrom datetime import datetime\n\nclass ${svc}Schema(BaseModel):\n    id: str\n    name: str\n    created_at: datetime = datetime.now()\n`
      );
      zip.file(
        `backend/migrations/00${serviceNames.indexOf(svc) + 1}_create_${svc.toLowerCase()}_table.sql`,
        `CREATE TABLE IF NOT EXISTS tbl_${svc.toLowerCase()} (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  name VARCHAR(255) NOT NULL,\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n);\n`
      );
    });

    // Documentation & Configs
    zip.file('docs/ARCHITECTURE.md', `# System Architecture\n\nDetailed specifications for all microservices and frontend clients.\n`);
    zip.file('docs/DEPLOYMENT.md', `# Deployment Protocols\n\nStep by step deployment guides.\n`);
    zip.file('docs/SECURITY.md', `# Security Policies\n\nZero-trust architecture policies.\n`);
    zip.file('.github/workflows/ci.yml', `name: CI\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n`);
    zip.file('.github/workflows/cd.yml', `name: CD\non: [workflow_dispatch]\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo "Deploying"\n`);
    zip.file('docker/Dockerfile.api', `FROM node:20-alpine\nWORKDIR /app\nCOPY . .\nRUN npm install\nCMD ["node", "dist/index.js"]\n`);
    zip.file('docker/docker-compose.yml', `version: '3.8'\nservices:\n  app:\n    build: .\n    ports:\n      - "3000:3000"\n`);
    zip.file('package.json', `{\n  "name": "enterprise-codebase",\n  "version": "2.4.0",\n  "private": true\n}\n`);
    zip.file('tsconfig.json', `{\n  "compilerOptions": {\n    "target": "ES2022"\n  }\n}\n`);

    const blob = await zip.generateAsync({ type: 'blob' });
    return new File([blob], 'enterprise-large-codebase.zip', { type: 'application/zip' });
  }

  if (type === 'fullstack') {
    zip.file(
      'src/index.ts',
      `import { createServer } from './server';\n\nconst port = process.env.PORT || 3000;\ncreateServer().listen(port, () => {\n  console.log('App running on port ' + port);\n});\n`
    );
    zip.file(
      'src/server.ts',
      `import express from 'express';\nimport { routes } from './routes';\n\nexport function createServer() {\n  const app = express();\n  app.use(express.json());\n  app.use('/api', routes);\n  return app;\n}\n`
    );
    zip.file(
      'src/routes.ts',
      `import { Router } from 'express';\nexport const routes = Router();\n\nroutes.get('/health', (req, res) => {\n  res.json({ status: 'ok', timestamp: Date.now() });\n});\n`
    );
    zip.file(
      'frontend/App.jsx',
      `import React, { useState } from 'react';\n\nexport function App() {\n  const [count, setCount] = useState(0);\n  return (\n    <div className="container">\n      <h1>Hello Fullstack</h1>\n      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>\n    </div>\n  );\n}\n`
    );
    zip.file(
      'frontend/main.jsx',
      `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport { App } from './App';\n\nReactDOM.createRoot(document.getElementById('root')).render(<App />);\n`
    );
    zip.file(
      'scripts/deploy.py',
      `import os\nimport sys\n\ndef run_deploy():\n    print("Deploying bundle to cloud environment...")\n    print("Validation passed.")\n\nif __name__ == "__main__":\n    run_deploy()\n`
    );
    zip.file(
      'scripts/benchmark.py',
      `import time\n\ndef benchmark_bundle():\n    start = time.time()\n    time.sleep(0.05)\n    print(f"Benchmark took {time.time() - start:.4f}s")\n`
    );
    zip.file(
      'styles/main.css',
      `:root {\n  --primary: #3b82f6;\n  --bg: #0f172a;\n}\n\nbody {\n  margin: 0;\n  background: var(--bg);\n  color: #fff;\n  font-family: sans-serif;\n}\n`
    );
    zip.file(
      'public/index.html',
      `<!DOCTYPE html>\n<html>\n  <head>\n    <title>Sample Application</title>\n    <link rel="stylesheet" href="../styles/main.css">\n  </head>\n  <body>\n    <div id="root"></div>\n  </body>\n</html>\n`
    );
    zip.file(
      'package.json',
      `{\n  "name": "sample-fullstack-app",\n  "version": "1.0.0",\n  "private": true,\n  "scripts": {\n    "build": "vite build",\n    "test": "vitest"\n  }\n}\n`
    );
    zip.file(
      'README.md',
      `# Sample Fullstack App\n\nA fullstack demonstration application containing TypeScript backend, React JSX frontend, Python deployment scripts, CSS styling, and HTML templates.\n`
    );
    zip.file('.gitignore', `node_modules/\ndist/\n.env\n*.log\n`);
  } else {
    zip.file(
      'src/index.ts',
      `export * from './tokenizer';\nexport * from './parser';\nexport * from './formatter';\n`
    );
    zip.file(
      'src/tokenizer.ts',
      `export interface Token {\n  type: string;\n  value: string;\n}\n\nexport function tokenize(input: string): Token[] {\n  return input.split(/\\s+/).map(t => ({ type: 'word', value: t }));\n}\n`
    );
    zip.file(
      'src/parser.ts',
      `import { Token } from './tokenizer';\n\nexport function parse(tokens: Token[]): object {\n  return { count: tokens.length, tree: tokens };\n}\n`
    );
    zip.file(
      'src/formatter.ts',
      `export function formatAst(ast: object): string {\n  return JSON.stringify(ast, null, 2);\n}\n`
    );
    zip.file(
      'tests/tokenizer.test.ts',
      `import { tokenize } from '../src/tokenizer';\n\ntest('tokenizes basic strings', () => {\n  const tokens = tokenize('hello world');\n  expect(tokens).toHaveLength(2);\n});\n`
    );
    zip.file(
      'tsconfig.json',
      `{\n  "compilerOptions": {\n    "target": "ES2022",\n    "module": "NodeNext",\n    "declaration": true,\n    "strict": true\n  }\n}\n`
    );
    zip.file('README.md', `# Core Tokenizer Library\n\nA zero-dependency TypeScript parser library.\n`);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const filename = type === 'fullstack' ? 'sample-fullstack-app.zip' : 'sample-typescript-lib.zip';
  return new File([blob], filename, { type: 'application/zip' });
}

/**
 * Triggers browser download of a Blob.
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
