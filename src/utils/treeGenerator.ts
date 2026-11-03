import { TreeNode, ZipEntryItem, ExtensionGroup } from '../types/bundler';

/**
 * Builds a nested directory tree structure from a list of ZipEntryItems.
 */
export function buildTreeHierarchy(entries: ZipEntryItem[], rootName: string = 'root'): TreeNode {
  const root: TreeNode = {
    name: rootName,
    path: '',
    isDirectory: true,
    size: 0,
    extension: '',
    children: [],
  };

  for (const entry of entries) {
    if (!entry.path) continue;
    const parts = entry.path.replace(/\/$/, '').split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;
      const isDir = isLast ? entry.isDirectory : true;
      const currentPath = parts.slice(0, i + 1).join('/');

      let existing = current.children.find((c) => c.name === part);
      if (!existing) {
        existing = {
          name: part,
          path: currentPath,
          isDirectory: isDir,
          size: isLast ? entry.size : 0,
          extension: isLast ? entry.extension : '',
          children: [],
        };
        current.children.push(existing);
      } else if (isLast && !entry.isDirectory) {
        existing.size = entry.size;
        existing.extension = entry.extension;
      }

      current = existing;
    }
  }

  // Recursively sort children (directories first, then alphabetically) and sum directory sizes
  function finalizeNode(node: TreeNode): number {
    node.children.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    let total = node.size;
    for (const child of node.children) {
      total += finalizeNode(child);
    }
    node.size = total;
    return total;
  }

  finalizeNode(root);
  return root;
}

/**
 * Formats a byte number into a human-readable string.
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Generates an ASCII tree diagram from a TreeNode.
 */
export function generateAsciiTree(node: TreeNode): string {
  return buildCompleteAsciiTree(node);
}

function renderTreeLines(node: TreeNode, prefix: string, isLast: boolean): string[] {
  const marker = isLast ? '└── ' : '├── ';
  const childPrefix = prefix + (isLast ? '    ' : '│   ');
  const sizeLabel = node.isDirectory ? '' : ` (${formatBytes(node.size)})`;
  const nameWithSlash = node.isDirectory ? `${node.name}/` : node.name;
  const line = `${prefix}${marker}${nameWithSlash}${sizeLabel}`;

  const lines = [line];
  if (node.children && node.children.length > 0) {
    node.children.forEach((child, idx) => {
      const childIsLast = idx === node.children.length - 1;
      lines.push(...renderTreeLines(child, childPrefix, childIsLast));
    });
  }
  return lines;
}

export function buildCompleteAsciiTree(root: TreeNode): string {
  const lines: string[] = [`${root.name}/`];
  root.children.forEach((child, idx) => {
    const isLast = idx === root.children.length - 1;
    lines.push(...renderTreeLines(child, '', isLast));
  });
  return lines.join('\n');
}

/**
 * Creates the complete FILE_TREE.md document content.
 */
export function generateMarkdownReport(
  archiveName: string,
  totalFiles: number,
  totalDirectories: number,
  totalBytes: number,
  groups: ExtensionGroup[],
  asciiTree: string
): string {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

  let md = `# Repository File Tree & Ingestion Report\n\n`;
  md += `> Ingestion report generated for \`${archiveName}\` on ${timestamp} UTC.\n`;
  md += `> This report catalogs all initial files and details the consolidated bundles produced.\n\n`;

  md += `## 1. Archive Summary\n\n`;
  md += `| Metric | Value |\n`;
  md += `| :--- | :--- |\n`;
  md += `| **Source Archive** | \`${archiveName}\` |\n`;
  md += `| **Total Files Detected** | ${totalFiles.toLocaleString()} |\n`;
  md += `| **Total Directories** | ${totalDirectories.toLocaleString()} |\n`;
  md += `| **Total Uncompressed Size** | ${formatBytes(totalBytes)} (${totalBytes.toLocaleString()} bytes) |\n`;
  md += `| **Unique File Extensions** | ${groups.length} |\n\n`;

  md += `## 2. Bundles by File Extension\n\n`;
  md += `Files with identical extensions have been concatenated into consolidated bundle files with non-destructive path headers.\n\n`;
  md += `| Extension | Bundled Output File | File Count | Total Size | Total Lines |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;

  for (const group of groups) {
    const extDisplay = group.extension === 'no-extension' ? '*(no extension)*' : `\`${group.extension}\``;
    md += `| ${extDisplay} | \`${group.bundleFileName}\` | ${group.count.toLocaleString()} | ${formatBytes(group.totalBytes)} | ${group.totalLines > 0 ? group.totalLines.toLocaleString() : 'N/A (binary)'} |\n`;
  }
  md += `\n`;

  md += `## 3. Initial Visual File Tree\n\n`;
  md += `Below is the structural hierarchy of the extracted files prior to bundling:\n\n`;
  md += '```text\n';
  md += asciiTree;
  md += '\n```\n\n';

  md += `## 4. Comprehensive File Inventory\n\n`;
  for (const group of groups) {
    const headerTitle = group.extension === 'no-extension' ? 'Files without extension' : `Files: .${group.extension.replace(/^\./, '')}`;
    md += `### ${headerTitle} (${group.count} ${group.count === 1 ? 'file' : 'files'}, ${formatBytes(group.totalBytes)})\n\n`;
    md += `Bundled into: \`${group.bundleFileName}\`\n\n`;
    md += `| Relative File Path | Size | Lines |\n`;
    md += `| :--- | :--- | :--- |\n`;
    for (const f of group.files) {
      md += `| \`${f.path}\` | ${formatBytes(f.size)} | ${f.lineCount > 0 ? f.lineCount.toLocaleString() : '-'} |\n`;
    }
    md += `\n`;
  }

  return md;
}
