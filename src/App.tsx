import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import { indexedDbPersistedOptions } from "./idb";
import { useState } from "react";

const timeQuery = queryOptions({
  queryKey: ["time"],
  queryFn: async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return { time: new Date().toISOString() };
  },
  staleTime: 4000,
  ...indexedDbPersistedOptions,
});

export function App() {
  const queryClient = useQueryClient();

  const [showUseQuery, setShowUseQuery] = useState(true);

  return (
    <div>
      <button onClick={() => queryClient.invalidateQueries(timeQuery)}>
        invalidate
      </button>
      <div style={{ border: "1px solid black", padding: "8px" }}>
        <h3>useQuery</h3>
        <button onClick={() => setShowUseQuery((s) => !s)}>
          {showUseQuery ? "hide" : "show"}
        </button>
        {showUseQuery && <Query />}
      </div>
    </div>
  );
}

function Query() {
  const query = useQuery(timeQuery);

  return (
    <div>
      <pre>{query.data ? JSON.stringify(query.data.time) : "loading..."}</pre>
    </div>
  );
}
