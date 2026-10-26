export function directoryUrl(value: string) {
  return value ? `/?${new URLSearchParams({ path: value })}` : "/";
}
