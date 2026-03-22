import { getApiBaseUrl } from "./api";

interface AIResponse {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}

export async function askAI(userMessage: string): Promise<AIResponse> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: userMessage,
      }),
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Request failed with status ${response.status}`,
      };
    }

    return (await response.json()) as AIResponse;
  } catch {
    return {
      success: false,
      error: "Unable to reach AI service. Set EXPO_PUBLIC_API_BASE_URL or run backend on port 3000.",
    };
  }
}
