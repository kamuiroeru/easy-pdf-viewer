import { serve } from "@hono/node-server";
import { createServerApp } from "@be/application.ts";

const app = createServerApp();

serve({ fetch: app.fetch, hostname: "127.0.0.1", port: 3000 }, (info) => {
  console.log(`Server listening on http://127.0.0.1:${info.port}`);
});
