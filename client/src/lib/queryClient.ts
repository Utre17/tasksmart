import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Specially handle 401 errors for better UX
    if (res.status === 401) {
      // If on auth page, don't throw to prevent redirect loops
      if (window.location.pathname === "/auth") {
        throw new Error("Not authenticated");
      }
      // Clear token on unauthorized and redirect only if not on auth page
      localStorage.removeItem("token");
    }
    
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Helper function to get auth headers from localStorage
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const authHeaders = getAuthHeaders();
  
  // Skip certain requests on auth page to prevent reload cycles
  if (window.location.pathname === "/auth" && url === "/api/tasks") {
    const mockResponse = new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    return mockResponse;
  }
  
  const headers: Record<string, string> = {
    ...authHeaders
  };
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn = <T>(options: {
  on401: UnauthorizedBehavior;
}): QueryFunction<T> => 
  async ({ queryKey }) => {
    // Skip unnecessary queries on auth page to prevent redirect loops
    if (window.location.pathname === "/auth") {
      if (queryKey[0] === "/api/tasks") {
        return [] as unknown as T;
      }
      if (queryKey[0] === "/api/auth/me") {
        if (options.on401 === "returnNull") {
          return null as unknown as T;
        }
        throw new Error("Not authenticated");
      }
    }
    
    const authHeaders = getAuthHeaders();
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers: authHeaders
    });

    if (options.on401 === "returnNull" && res.status === 401) {
      return null as unknown as T;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn<unknown>({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
