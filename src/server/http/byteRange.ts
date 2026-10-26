/** undefined means ignore Range; null means an unsatisfiable byte range. */
export function parseByteRange(value: string | undefined, size: number) {
  const match = value?.match(/^bytes=(\d*)-(\d*)$/i);
  if (!match || (!match[1] && !match[2])) return undefined;
  const length = BigInt(size);
  const first = match[1] ? BigInt(match[1]) : undefined;
  const last = match[2] ? BigInt(match[2]) : undefined;
  if (first !== undefined && last !== undefined && first > last) return undefined;
  if (length === 0n) return null;
  if (first === undefined) {
    if (last === 0n) return null;
    return { start: Number(last! >= length ? 0n : length - last!), end: size - 1 };
  }
  if (first >= length) return null;
  return {
    start: Number(first),
    end: Number(last === undefined || last >= length ? length - 1n : last),
  };
}
