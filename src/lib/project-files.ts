export const DEFAULT_PROJECT_BYTE_LIMIT = 4 * 1024 * 1024;

type ProjectFileLike = {
  name: string;
  size: number;
  type: string;
  webkitRelativePath?: string;
  text: () => Promise<string>;
};

export type ProjectBundle = {
  code: string;
  rootName: string;
  includedFiles: number;
  ignoredFiles: number;
  totalBytes: number;
  language: "typescript" | "javascript" | "cpp" | "python" | "rust" | "go";
  limited: boolean;
};

const SOURCE_EXTENSIONS = new Set([
  "bash", "c", "cc", "cpp", "css", "cxx", "dockerfile", "go", "gql",
  "graphql", "h", "hpp", "htm", "html", "hxx", "java", "js", "json",
  "jsonc", "jsx", "kt", "kts", "less", "md", "mdx", "mjs", "php", "proto",
  "ps1", "py", "rb", "rs", "sass", "scss", "sh", "sql", "svelte", "swift",
  "toml", "ts", "tsx", "txt", "vue", "xml", "yaml", "yml", "zsh",
]);

const SOURCE_NAMES = new Set([
  "dockerfile",
  "jenkinsfile",
  "makefile",
  "procfile",
]);

const IGNORED_DIRECTORIES = new Set([
  ".cache", ".git", ".next", ".nuxt", ".output", ".parcel-cache", ".svelte-kit",
  ".turbo", ".venv", "__pycache__", "build", "coverage", "dist", "node_modules",
  "out", "target", "vendor", "venv",
]);

const IGNORED_FILES = new Set([
  "bun.lock", "bun.lockb", "composer.lock", "package-lock.json", "pnpm-lock.yaml",
  "poetry.lock", "yarn.lock",
]);

function normalizedPath(file: ProjectFileLike) {
  return (file.webkitRelativePath || file.name).replaceAll("\\", "/");
}

function extensionFor(path: string) {
  const name = path.split("/").at(-1)?.toLowerCase() ?? "";
  const dot = name.lastIndexOf(".");
  return dot > -1 ? name.slice(dot + 1) : name;
}

function isSourceFile(path: string, type: string) {
  const lowerPath = path.toLowerCase();
  const parts = lowerPath.split("/");
  const name = parts.at(-1) ?? "";
  if (parts.some((part) => IGNORED_DIRECTORIES.has(part))) return false;
  if (IGNORED_FILES.has(name) || name.endsWith(".map") || name.includes(".min.")) {
    return false;
  }
  if (name === ".env" || (name.startsWith(".env.") && name !== ".env.example")) {
    return false;
  }
  if (/\.(pem|key|p12|pfx|sqlite|db|log)$/i.test(name)) return false;
  if (type && !type.startsWith("text/") && type !== "application/json") return false;
  return SOURCE_EXTENSIONS.has(extensionFor(lowerPath)) || SOURCE_NAMES.has(name);
}

function languageFor(path: string): ProjectBundle["language"] | null {
  const extension = extensionFor(path);
  if (["ts", "tsx"].includes(extension)) return "typescript";
  if (["js", "jsx", "mjs"].includes(extension)) return "javascript";
  if (["c", "cc", "cpp", "cxx", "h", "hpp", "hxx"].includes(extension)) return "cpp";
  if (extension === "py") return "python";
  if (extension === "rs") return "rust";
  if (extension === "go") return "go";
  return null;
}

export async function prepareProjectFiles(
  files: readonly ProjectFileLike[],
  byteLimit = DEFAULT_PROJECT_BYTE_LIMIT,
): Promise<ProjectBundle> {
  const sorted = [...files]
    .map((file) => ({ file, path: normalizedPath(file) }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const firstParts = sorted[0]?.path.split("/") ?? [];
  const rootName = firstParts.length > 1 ? firstParts[0] : "project";
  const chunks: string[] = [];
  const languages = new Map<ProjectBundle["language"], number>();
  let totalBytes = 0;
  let limited = false;

  for (const { file, path } of sorted) {
    if (!isSourceFile(path, file.type)) continue;
    if (file.size > byteLimit || totalBytes + file.size > byteLimit) {
      limited = true;
      continue;
    }
    try {
      const source = await file.text();
      if (source.includes("\0")) continue;
      const relativePath = path.startsWith(`${rootName}/`)
        ? path.slice(rootName.length + 1)
        : path;
      chunks.push(`/* file: ${relativePath} */\n${source}`);
      totalBytes += file.size;
      const language = languageFor(path);
      if (language) languages.set(language, (languages.get(language) ?? 0) + 1);
    } catch {
      // Unreadable local entries are ignored without interrupting the folder import.
    }
  }

  const language = [...languages.entries()].sort(
    (left, right) => right[1] - left[1],
  )[0]?.[0] ?? "typescript";

  return {
    code: chunks.join("\n\n"),
    rootName,
    includedFiles: chunks.length,
    ignoredFiles: files.length - chunks.length,
    totalBytes,
    language,
    limited,
  };
}
