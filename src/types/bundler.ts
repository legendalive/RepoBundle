export interface ZipEntryItem {
  path: string;
  name: string;
  extension: string;
  size: number;
  isDirectory: boolean;
  lineCount: number;
  isBinary: boolean;
}

export interface TreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  extension: string;
  children: TreeNode[];
}

export interface ExtensionGroup {
  extension: string;
  label: string;
  bundleFileName: string;
  count: number;
  totalBytes: number;
  totalLines: number;
  files: ZipEntryItem[];
  previewContent: string;
  isTruncatedInPreview: boolean;
  fullBlob: Blob;
  isBinary: boolean;
}

export interface BundlingResult {
  archiveName: string;
  totalFiles: number;
  totalDirectories: number;
  totalBytes: number;
  groups: ExtensionGroup[];
  markdownTree: string;
  rootTreeNode: TreeNode;
  outputZipBlob: Blob | null;
  outputZipSize: number;
  processingTimeMs: number;
}
