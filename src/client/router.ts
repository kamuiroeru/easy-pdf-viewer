import type { LoaderFunctionArgs, RouteObject } from "react-router";
import { api } from "./api";
import App, { DirectoryError, DirectoryLoading } from "./App";

export async function directoryLoader({ request }: LoaderFunctionArgs) {
  const path = new URL(request.url).searchParams.get("path") ?? "";
  const response = await api.api.directories.$get(
    { query: { path } },
    { init: { signal: request.signal } },
  );
  if (!response.ok) {
    throw new Response(null, { status: response.status });
  }
  return { path, ...(await response.json()) };
}

export const routes: RouteObject[] = [
  {
    path: "/",
    loader: directoryLoader,
    Component: App,
    HydrateFallback: DirectoryLoading,
    ErrorBoundary: DirectoryError,
  },
];
