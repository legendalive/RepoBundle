/**
 * Returns a language-appropriate comment header for separating concatenated files.
 * The original code content is NEVER altered, added to, or deleted.
 */
export function formatFileHeader(
  filePath: string,
  extension: string,
  fileIndex: number,
  totalInGroup: number
): string {
  const ext = extension.toLowerCase().replace(/^\./, '');
  const banner = `=== File [${fileIndex + 1}/${totalInGroup}]: ${filePath} ===`;

  // C-style, JavaScript, TypeScript, Rust, Go, Java, Kotlin, Swift, C#, PHP, Dart, Scala
  if (
    [
      'js',
      'jsx',
      'mjs',
      'cjs',
      'ts',
      'tsx',
      'mts',
      'cts',
      'c',
      'h',
      'cpp',
      'hpp',
      'cc',
      'cs',
      'java',
      'kt',
      'kts',
      'rs',
      'go',
      'swift',
      'php',
      'dart',
      'scala',
      'jsonc',
      'sol',
      'proto',
    ].includes(ext)
  ) {
    return `// ${banner}\n`;
  }

  // Shell, Python, Ruby, YAML, TOML, Perl, R, Dockerfile, Gitignore, Env, Config
  if (
    [
      'py',
      'pyw',
      'sh',
      'bash',
      'zsh',
      'rb',
      'yaml',
      'yml',
      'toml',
      'r',
      'pl',
      'pm',
      'dockerfile',
      'gitignore',
      'env',
      'ini',
      'cfg',
      'conf',
      'properties',
      'makefile',
      'cmake',
    ].includes(ext)
  ) {
    return `# ${banner}\n`;
  }

  // CSS, SCSS, SASS, LESS
  if (['css', 'scss', 'sass', 'less'].includes(ext)) {
    return `/* ${banner} */\n`;
  }

  // HTML, XML, SVG, Markdown, Vue, Svelte
  if (['html', 'htm', 'xml', 'svg', 'xhtml', 'vue', 'svelte', 'md', 'markdown'].includes(ext)) {
    return `<!-- ${banner} -->\n`;
  }

  // SQL, Lua, Haskell, Ada
  if (['sql', 'lua', 'hs', 'ada'].includes(ext)) {
    return `-- ${banner}\n`;
  }

  // Lisp, Clojure, Elisp
  if (['clj', 'cljs', 'lisp', 'el', 'scm'].includes(ext)) {
    return `;; ${banner}\n`;
  }

  // TeX, LaTeX, MATLAB, Erlang
  if (['tex', 'latex', 'm', 'erl', 'hrl'].includes(ext)) {
    return `% ${banner}\n`;
  }

  // Generic fallback for plain text or unidentified source extensions
  return `// ${banner}\n`;
}
