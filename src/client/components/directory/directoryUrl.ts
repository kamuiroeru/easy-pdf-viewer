export function directoryUrl(value: string): string {
  return value ? `/?${new URLSearchParams({ path: value })}` : "/";
}
