import Constants from "expo-constants";
import { Platform } from "react-native";

export const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.EXPO_PUBLIC_AI_BASE_URL;
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
