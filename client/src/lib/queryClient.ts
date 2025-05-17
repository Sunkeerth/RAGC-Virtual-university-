import { QueryClient, QueryFunction, QueryFunctionContext } from "@tanstack/react-query";

// Helper to throw detailed errors
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Generic API request function with token handling
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = localStorage.getItem("authToken");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // Important for cookie sessions
    });

    if (res.status === 401) {
      // Token invalid or missing
      localStorage.removeItem("authToken");
      window.location.href = "/auth"; // Redirect to login page
      throw new Error("401: Unauthorized");
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error("API Request Error:", error);
    throw error;
  }
}

// Query function used by React Query
type UnauthorizedBehavior = "returnNull" | "throw" | "redirect";

export const getQueryFn = <T>(options: {
  on401?: UnauthorizedBehavior;
} = {}): QueryFunction<T> => async (context: QueryFunctionContext) => {
  const url = context.queryKey[0] as string;
  const token = localStorage.getItem("authToken");

  try {
    const res = await fetch(url, {
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (res.status === 401) {
      localStorage.removeItem("authToken");

      switch (options.on401) {
        case "returnNull":
          return null as T;
        case "redirect":
          window.location.href = "/auth"; // Redirect to auth page
          return new Promise<T>(() => {}); // Block render
        default:
          throw new Error("Unauthorized");
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  } catch (error) {
    console.error("Query failed:", error);
    throw error;
  }
};

// Query Client for React Query
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "redirect" }),
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes("401")) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: false,
    },
  },
});
