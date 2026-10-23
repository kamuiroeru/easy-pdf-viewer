export const sleepMs = (ms: number): Promise<void> =>
  new Promise((res) => {
    setTimeout(res, ms);
  });
