import React, { useState, useMemo } from 'react';
import { TreeNode } from '../types/bundler';
import { formatBytes } from '../utils/treeGenerator';
import {
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  Search,
  ChevronRight,
  ChevronDown,
  Layers,
  File as FileIcon,
} from 'lucide-react';

interface FileTreeViewerProps {
  rootNode: TreeNode;
  archiveName: string;
}

interface TreeNodeItemProps {
  node: TreeNode;
  level: number;
  expandedMap: Record<string, boolean>;
  toggleExpand: (path: string) => void;
  searchFilter: string;
}

function getFileIcon(extension: string) {
  const ext = extension.toLowerCase().replace(/^\./, '');
  if (['ts', 'tsx'].includes(ext)) {
    return <FileCode className="w-3.5 h-3.5 text-[#d4a359] shrink-0" />;
  }
  if (['js', 'jsx'].includes(ext)) {
    return <FileCode className="w-3.5 h-3.5 text-amber-300 shrink-0" />;
  }
  if (['py'].includes(ext)) {
    return <FileCode className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
  }
  if (['css', 'scss', 'sass'].includes(ext)) {
    return <FileCode className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
  }
  if (['md', 'txt', 'json', 'yaml', 'yml', 'toml'].includes(ext)) {
    return <FileText className="w-3.5 h-3.5 text-stone-300 shrink-0" />;
  }
  return <FileIcon className="w-3.5 h-3.5 text-stone-500 shrink-0" />;
}

const TreeNodeItem: React.FC<TreeNodeItemProps> = ({
  node,
  level,
  expandedMap,
  toggleExpand,
  searchFilter,
}) => {
  const isExpanded = expandedMap[node.path] ?? (level < 2);

  const matchesSearch = useMemo(() => {
    if (!searchFilter) return true;
    const filter = searchFilter.toLowerCase();
    function checkNode(n: TreeNode): boolean {
      if (n.name.toLowerCase().includes(filter) || n.path.toLowerCase().includes(filter)) {
        return true;
      }
      return n.children.some(checkNode);
    }
    return checkNode(node);
  }, [node, searchFilter]);

  if (!matchesSearch) return null;

  return (
    <div className="select-none">
      <div
        onClick={() => node.isDirectory && toggleExpand(node.path)}
        className={`flex items-center justify-between py-1 px-2 rounded-md hover:bg-[#181c26] transition-colors font-mono text-xs cursor-pointer ${
          node.isDirectory ? 'text-stone-200 font-medium' : 'text-stone-400'
        }`}
        style={{ paddingLeft: `${Math.max(level * 16 + 8, 8)}px` }}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {node.isDirectory ? (
            <span className="text-stone-500 w-4 h-4 flex items-center justify-center shrink-0">
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </span>
          ) : (
            <span className="w-4 h-4 shrink-0" />
          )}

          {node.isDirectory ? (
            isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-[#e0b471] shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-[#cca162] shrink-0" />
            )
          ) : (
            getFileIcon(node.extension)
          )}

          <span className="truncate">{node.name}</span>
        </div>

        <div className="flex items-center gap-2 text-stone-500 font-mono text-[11px] tabular-nums shrink-0 ml-4">
          <span>{formatBytes(node.size)}</span>
        </div>
      </div>

      {node.isDirectory && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem
              key={child.path}
              node={child}
              level={level + 1}
              expandedMap={expandedMap}
              toggleExpand={toggleExpand}
              searchFilter={searchFilter}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTreeViewer: React.FC<FileTreeViewerProps> = ({ rootNode, archiveName }) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  const toggleExpand = (path: string) => {
    setExpandedMap((prev) => ({
      ...prev,
      [path]: !(prev[path] ?? true),
    }));
  };

  const handleExpandAll = () => {
    const all: Record<string, boolean> = {};
    function collect(n: TreeNode) {
      if (n.isDirectory) {
        all[n.path] = true;
        n.children.forEach(collect);
      }
    }
    collect(rootNode);
    setExpandedMap(all);
  };

  const handleCollapseAll = () => {
    const all: Record<string, boolean> = {};
    function collect(n: TreeNode) {
      if (n.isDirectory) {
        all[n.path] = false;
        n.children.forEach(collect);
      }
    }
    collect(rootNode);
    setExpandedMap(all);
  };

  return (
    <div className="rounded-xl border border-[#1e222d] bg-[#11131a] flex flex-col h-full overflow-hidden">
      {/* Search and control bar */}
      <div className="p-3.5 border-b border-[#1e222d] flex flex-wrap items-center justify-between gap-3 bg-[#0d0f15]/80">
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <div className="relative w-full max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
            <input
              type="text"
              placeholder="Search directory..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-[#161922] border border-[#252b3a] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-[#d4a359]/70 font-mono transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExpandAll}
            className="px-2.5 py-1 text-xs font-medium text-stone-300 bg-[#1a1e28] hover:bg-[#232836] border border-[#272e3f] rounded transition-colors cursor-pointer"
          >
            Expand
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            className="px-2.5 py-1 text-xs font-medium text-stone-300 bg-[#1a1e28] hover:bg-[#232836] border border-[#272e3f] rounded transition-colors cursor-pointer"
          >
            Collapse
          </button>
        </div>
      </div>

      {/* Tree list */}
      <div className="p-3 overflow-y-auto max-h-[580px]">
        <div className="flex items-center gap-2 py-1 px-2 font-mono text-xs font-bold text-stone-200">
          <Layers className="w-4 h-4 text-[#d4a359]" />
          <span>{rootNode.name}/</span>
          <span className="text-stone-500 font-normal ml-auto text-[11px] tabular-nums">
            {formatBytes(rootNode.size)}
          </span>
        </div>

        {rootNode.children.map((child) => (
          <TreeNodeItem
            key={child.path}
            node={child}
            level={1}
            expandedMap={expandedMap}
            toggleExpand={toggleExpand}
            searchFilter={searchFilter}
          />
        ))}
      </div>
    </div>
  );
};
