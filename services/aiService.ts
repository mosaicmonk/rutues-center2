import Constants from "expo-constants";
import { Platform } from "react-native";

interface AIResponse {
  success: boolean;
  reply?: string;
  provider?: string;
  model?: string;
  error?: string;
  [key: string]: unknown;
}

const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_AI_BASE_URL;
  if (envUrl) {
    return envUrl;
  }

  const hostUri = Constants.expoConfig?.hostUri ?? Constants.manifest2?.extra?.expoGo?.debuggerHost;
  const host = hostUri?.split(":")[0];

  if (host) {
    return `http://${host}:3000`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3000";
  }

  return "http://localhost:3000";
};

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
      const payload = (await response.json().catch(() => null)) as AIResponse | null;
      return {
        success: false,
        error: payload?.error ?? `Request failed with status ${response.status}`,
      };
    }

    return (await response.json()) as AIResponse;
  } catch {
    return {
      success: false,
      error: "Unable to reach AI service. Start the backend or set EXPO_PUBLIC_AI_BASE_URL.",
    };
  }
}
