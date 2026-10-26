export const ByteRangeKind = {
  Partial: "partial",
  Unsatisfiable: "unsatisfiable",
  Ignore: "ignore",
} as const;

export type ByteRangeKind = (typeof ByteRangeKind)[keyof typeof ByteRangeKind];

export type ByteRangeResult =
  | { kind: typeof ByteRangeKind.Partial; start: number; end: number }
  | { kind: typeof ByteRangeKind.Unsatisfiable }
  | { kind: typeof ByteRangeKind.Ignore };

export function parseByteRange(value: string | undefined, size: number): ByteRangeResult {
  const match = value?.match(/^bytes=(\d*)-(\d*)$/i);
  if (!match || (!match[1] && !match[2])) return { kind: ByteRangeKind.Ignore };
  const length = BigInt(size);
  const first = match[1] ? BigInt(match[1]) : undefined;
  const last = match[2] ? BigInt(match[2]) : undefined;
  if (first !== undefined && last !== undefined && first > last)
    return { kind: ByteRangeKind.Ignore };
  if (length === 0n) return { kind: ByteRangeKind.Unsatisfiable };
  if (first === undefined) {
    if (last === 0n) return { kind: ByteRangeKind.Unsatisfiable };
    return {
      kind: ByteRangeKind.Partial,
      start: Number(last! >= length ? 0n : length - last!),
      end: size - 1,
    };
  }
  if (first >= length) return { kind: ByteRangeKind.Unsatisfiable };
  return {
    kind: ByteRangeKind.Partial,
    start: Number(first),
    end: Number(last === undefined || last >= length ? length - 1n : last),
  };
}
