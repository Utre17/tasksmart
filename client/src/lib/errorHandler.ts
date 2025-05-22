import { useToast } from "@/hooks/use-toast";

export type ApiError = {
  status: number;
  message: string;
  errors?: any[];
};

// Standard error response for API operations
export class ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  isSuccess: boolean;

  constructor(data: T | null, error: ApiError | null) {
    this.data = data;
    this.error = error;
    this.isSuccess = error === null;
  }

  static success<T>(data: T): ApiResponse<T> {
    return new ApiResponse<T>(data, null);
  }

  static failure<T>(error: ApiError): ApiResponse<T> {
    return new ApiResponse<T>(null, error);
  }
}

// Hook for handling API errors in components
export function useApiErrorHandler() {
  const { toast } = useToast();

  const handleApiError = (error: any, options?: { 
    showToast?: boolean;
    fallbackMessage?: string;
  }) => {
    const { showToast = true, fallbackMessage = "An unexpected error occurred" } = options || {};
    
    let errorMessage = fallbackMessage;
    let statusCode = 500;

    if (error.response) {
      statusCode = error.response.status;
      errorMessage = error.response.data?.message || fallbackMessage;
    } else if (error.message) {
      errorMessage = error.message;
    }

    if (showToast) {
      toast({
        title: `Error (${statusCode})`,
        description: errorMessage,
        variant: "destructive"
      });
    }

    return {
      message: errorMessage,
      status: statusCode
    };
  };

  return { handleApiError };
}

// Wrap API calls to standardize error handling
export async function apiCall<T>(
  promise: Promise<T>
): Promise<ApiResponse<T>> {
  try {
    const data = await promise;
    return ApiResponse.success(data);
  } catch (error: any) {
    const apiError: ApiError = {
      status: error.response?.status || 500,
      message: error.response?.data?.message || error.message || "Unknown error occurred",
      errors: error.response?.data?.errors
    };
    
    return ApiResponse.failure(apiError);
  }
} 