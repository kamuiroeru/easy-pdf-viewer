import { describe, expect, it } from "vite-plus/test";

// Runner smoke test: typed TypeScript executes in Node without a DOM.
describe("TypeScript unit test environment", () => {
  it("runs typed code in Node", () => {
    const values: number[] = [1, 2, 3];

    expect(values.map((value) => value * 2)).toEqual([2, 4, 6]);
    expect(typeof process.versions.node).toBe("string");
    expect("document" in globalThis).toBe(false);
  });
});
