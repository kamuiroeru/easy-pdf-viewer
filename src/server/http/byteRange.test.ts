import { describe, expect, it } from "vite-plus/test";
import { parseByteRange } from "./byteRange.ts";

describe("parseByteRange", () => {
  it.each([
    ["bytes=0-0", 5, 0, 0],
    ["bytes=1-3", 5, 1, 3],
    ["bytes=4-4", 5, 4, 4],
    ["bytes=3-", 5, 3, 4],
    ["bytes=-2", 5, 3, 4],
    ["bytes=-5", 5, 0, 4],
    ["bytes=-6", 5, 0, 4],
    ["bytes=2-5", 5, 2, 4],
    ["bytes=0-99999999999999999999999", 5, 0, 4],
    ["bytes=-99999999999999999999999", 5, 0, 4],
    ["BYTES=0-1", 5, 0, 1],
    ["bytes=01-03", 5, 1, 3],
    ["bytes=0-", 1, 0, 0],
    ["bytes=-1", 1, 0, 0],
    ["bytes=9007199254740990-", Number.MAX_SAFE_INTEGER, 9007199254740990, 9007199254740990],
  ])("resolves %s for a %i-byte file", (value, size, start, end) => {
    expect(parseByteRange(value, size)).toEqual({ start, end });
  });

  it.each([
    ["bytes=5-", 5],
    ["bytes=5-6", 5],
    ["bytes=-0", 5],
    ["bytes=99999999999999999999999-", 5],
    ["bytes=0-0", 0],
    ["bytes=0-", 0],
    ["bytes=-1", 0],
  ])("returns null for unsatisfiable %s on a %i-byte file", (value, size) => {
    expect(parseByteRange(value, size)).toBeNull();
  });

  it.each([
    undefined,
    "",
    "bytes=-",
    "bytes=3-1",
    "bytes=abc-def",
    "bytes=1.5-2",
    "bytes=+1-2",
    "bytes=0-1,3-4",
    "items=0-1",
    "bytes= 0-1",
    "bytes=0-1extra",
  ])("returns undefined to ignore missing, invalid or unsupported Range %s", (value) => {
    expect(parseByteRange(value, 5)).toBeUndefined();
  });
});
