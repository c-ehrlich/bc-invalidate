import React from "react";
import ReactDOM from "react-dom/client";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import {
  InvalidateOptions,
  InvalidateQueryFilters,
  QueryClient as BaseQueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { broadcastQueryClient } from "./broadcastQueryClient";
import { App } from "./App";

class QueryClient extends BaseQueryClient {
  constructor() {
    super();
  }

  invalidateQueries(
    filters: InvalidateQueryFilters = {},
    options: InvalidateOptions = {}
  ) {
    // if we don't have an observer for this querykey...
    if (filters.queryKey) {
      const q = this.getQueryCache().find({ queryKey: filters.queryKey });
      if (!q || !q.observers.length) {
        // ...then we need to notify the mutation cache that the query is invalidated
        this.getMutationCache().notify({
          type: "invalidated",
          mutation: {
            options: {
              mutationKey: filters.queryKey,
            },
          },
        } as any);
      }
    }

    return super.invalidateQueries(filters, options);
  }
}

export const queryClient = new QueryClient();

broadcastQueryClient({
  queryClient,
  broadcastChannel: "example-channel",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
