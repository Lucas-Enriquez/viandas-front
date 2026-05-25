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

const envGoogleMapsKey =
  typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY : undefined;

export const GOOGLE_MAPS_KEY =
  envGoogleMapsKey ?? (Constants.expoConfig?.extra?.googleMapsKey as string | undefined) ?? "";

export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.viandas.cook";
export const APP_STORE_URL = "https://apps.apple.com/app/viandas/id000000000";

const envWebUrl =
  typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_WEB_URL : undefined;

export const WEB_URL = (
  envWebUrl ?? (Constants.expoConfig?.extra?.webUrl as string | undefined) ?? "http://localhost:8081"
).replace(/\/$/, "");

export function buildInvitationLink(token: string) {
  return `${WEB_URL}/global-invitation/${token}`;
}

/**
 * Reemplaza el host de una URL del backend por WEB_URL. Útil mientras el
 * backend hardcodea otro dominio en publicUrl / whatsappText.
 */
export function rewriteShareUrl(url: string) {
  if (!url) return url;
  try {
    const original = new URL(url);
    const target = new URL(WEB_URL);
    original.protocol = target.protocol;
    original.host = target.host;
    return original.toString();
  } catch {
    return url;
  }
}

/** Aplica rewriteShareUrl al publicUrl y reemplaza ocurrencias en el texto. */
export function rewriteShareMessage(share: { publicUrl: string; whatsappText: string }) {
  const fixedUrl = rewriteShareUrl(share.publicUrl);
  const fixedText = share.publicUrl
    ? share.whatsappText.split(share.publicUrl).join(fixedUrl)
    : share.whatsappText;
  return { publicUrl: fixedUrl, whatsappText: fixedText };
}
