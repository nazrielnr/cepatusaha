export const FILE_PATH_KEYS = ['path', 'file_path', 'filePath', 'filepath', 'file', 'file_searched', 'source_path', 'dest_path', 'old_path', 'new_path', 'target_path', 'input_path', 'output_path', 'file_pattern'] as const;

export function toolFilePath(parameters: Record<string, unknown>): string | undefined {
  return FILE_PATH_KEYS.map((key) => parameters[key]).find((v): v is string => typeof v === 'string' && Boolean(v.trim()))
}

export function toolFilePathFromJson(raw = ''): string | undefined {
  for (const key of FILE_PATH_KEYS) {
    const match = new RegExp(`"${key}"\\s*:\\s*"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"`).exec(raw);
    if (match?.[1]) return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
}
