import Constants from "expo-constants";

declare const process:
  | {
      env?: Record<string, string | undefined>;
    }
  | undefined;

const envApiUrl = typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_API_URL : undefined;
const configuredApiUrl =
  envApiUrl ?? (Constants.expoConfig?.extra?.apiUrl as string | undefined);

export const API_URL = (configuredApiUrl ?? "http://10.0.2.2:8080").replace(/\/$/, "");
