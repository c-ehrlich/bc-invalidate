import { BroadcastChannel } from "broadcast-channel";
import type { BroadcastChannelOptions } from "broadcast-channel";
import type { QueryClient } from "@tanstack/query-core";
import { isEqual } from "lodash";

interface BroadcastQueryClientOptions {
  queryClient: QueryClient;
  broadcastChannel?: string;
  options?: BroadcastChannelOptions;
}

export function broadcastQueryClient({
  queryClient,
  broadcastChannel = "tanstack-query",
  options,
}: BroadcastQueryClientOptions) {
  let transaction = false;
  const tx = (cb: () => void) => {
    transaction = true;
    cb();
    transaction = false;
  };

  const channel = new BroadcastChannel(broadcastChannel, {
    webWorkerSupport: false,
    ...options,
  });

  const queryCache = queryClient.getQueryCache();

  queryClient.getQueryCache().subscribe((queryEvent) => {
    if (transaction) {
      return;
    }

    const {
      query: { queryHash, queryKey, state },
    } = queryEvent;

    if (queryEvent.type === "updated" && queryEvent.action.type === "success") {
      channel.postMessage({
        type: "updated",
        queryHash,
        queryKey,
        state,
      });
    }

    if (queryEvent.type === "removed") {
      channel.postMessage({
        type: "removed",
        queryHash,
        queryKey,
      });
    }
  });

  queryClient.getMutationCache().subscribe((mutationEvent) => {
    if (transaction) {
      return;
    }

    const { mutation, type } = mutationEvent;

    if ((type as string) === "invalidated") {
      channel.postMessage({
        type: "invalidated",
        queryKey: (mutation as any).options.mutationKey,
      });
    }
  });

  channel.onmessage = (action) => {
    if (!action?.type) {
      return;
    }

    tx(() => {
      const { type, queryHash, queryKey, state } = action;

      if (type === "updated") {
        const query = queryCache.get(queryHash);

        if (query && query.observers.length > 0) {
          // TODO: is this worth it?
          if (!isEqual(query.state.data, state.data)) {
            query.setState(state);

            queryCache.build(
              queryClient,
              {
                queryKey,
                queryHash,
              },
              state
            );
          }
        }
      } else if (type === "removed") {
        // const query = queryCache.get(queryHash);
        // if (query) {
        //   queryCache.remove(query);
        // }
      } else if (type === "invalidated") {
        queryClient.invalidateQueries(queryKey);
      }
    });
  };
}
