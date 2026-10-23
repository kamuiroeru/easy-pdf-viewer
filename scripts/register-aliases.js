import { registerHooks } from "node:module";

const aliases = {
  "@fe/": new URL("../src/client/", import.meta.url),
  "@be/": new URL("../src/server/", import.meta.url),
  "@s/": new URL("../src/shared/", import.meta.url),
};

// Node executes TypeScript directly; tsconfig paths only affect type checking.
registerHooks({
  resolve(specifier, context, nextResolve) {
    for (const [prefix, base] of Object.entries(aliases)) {
      if (specifier.startsWith(prefix)) {
        return nextResolve(new URL(specifier.slice(prefix.length), base).href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
