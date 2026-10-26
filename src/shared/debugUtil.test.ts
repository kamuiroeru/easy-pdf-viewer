import { expect, it, vi } from "vite-plus/test";
import { sleepMs } from "./debugUtil.ts";

it("resolves after the specified delay", async () => {
  vi.useFakeTimers();
  try {
    const resolved = vi.fn();
    const waiting = sleepMs(100).then(resolved);
    await vi.advanceTimersByTimeAsync(99);
    expect(resolved).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await waiting;
    expect(resolved).toHaveBeenCalledExactlyOnceWith(undefined);
  } finally {
    vi.useRealTimers();
  }
});
