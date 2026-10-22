import { cleanup } from "@testing-library/react";
import { afterEach } from "vite-plus/test";

// Vitest globals are disabled, so register cleanup explicitly.
afterEach(cleanup);
