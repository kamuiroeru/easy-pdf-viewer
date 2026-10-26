export const BYTE_RANGE_KIND = {
  PARTIAL: "partial",
  UNSATISFIABLE: "unsatisfiable",
  IGNORE: "ignore",
} as const;

type ByteRangeKind = (typeof BYTE_RANGE_KIND)[keyof typeof BYTE_RANGE_KIND];

export type ByteRangeResult =
  | { kind: typeof BYTE_RANGE_KIND.PARTIAL; start: number; end: number }
  | { kind: Exclude<ByteRangeKind, typeof BYTE_RANGE_KIND.PARTIAL> };

export function parseByteRange(value: string | undefined, size: number): ByteRangeResult {
  const match = value?.match(/^bytes=(\d*)-(\d*)$/i);
  if (!match || (!match[1] && !match[2])) return { kind: BYTE_RANGE_KIND.IGNORE };
  const length = BigInt(size);
  const first = match[1] ? BigInt(match[1]) : undefined;
  const last = match[2] ? BigInt(match[2]) : undefined;
  if (first !== undefined && last !== undefined && first > last)
    return { kind: BYTE_RANGE_KIND.IGNORE };
  if (length === 0n) return { kind: BYTE_RANGE_KIND.UNSATISFIABLE };
  if (first === undefined) {
    if (last === 0n) return { kind: BYTE_RANGE_KIND.UNSATISFIABLE };
    return {
      kind: BYTE_RANGE_KIND.PARTIAL,
      start: Number(last! >= length ? 0n : length - last!),
      end: size - 1,
    };
  }
  if (first >= length) return { kind: BYTE_RANGE_KIND.UNSATISFIABLE };
  return {
    kind: BYTE_RANGE_KIND.PARTIAL,
    start: Number(first),
    end: Number(last === undefined || last >= length ? length - 1n : last),
  };
}
