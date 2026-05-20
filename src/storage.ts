import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { ActiveDeliverySession, AuthSession } from "./types";

const AUTH_STORAGE_KEY = "viandas.auth";
const ACTIVE_DELIVERY_KEY = "viandas.activeDelivery";

export async function getAuthSession() {
  const raw = await getSecureItem(AUTH_STORAGE_KEY);
  return parseJson<AuthSession>(raw);
}

export async function setAuthSession(session: AuthSession) {
  await setSecureItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export async function clearAuthSession() {
  await deleteSecureItem(AUTH_STORAGE_KEY);
}

export async function getActiveDelivery() {
  const raw = await AsyncStorage.getItem(ACTIVE_DELIVERY_KEY);
  return parseJson<ActiveDeliverySession>(raw);
}

export async function setActiveDelivery(activeDelivery: ActiveDeliverySession) {
  await AsyncStorage.setItem(ACTIVE_DELIVERY_KEY, JSON.stringify(activeDelivery));
}

export async function clearActiveDelivery() {
  await AsyncStorage.removeItem(ACTIVE_DELIVERY_KEY);
}


async function getSecureItem(key: string) {
  if (await canUseSecureStore()) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(key);
}

async function setSecureItem(key: string, value: string) {
  if (await canUseSecureStore()) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

async function deleteSecureItem(key: string) {
  if (await canUseSecureStore()) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  await AsyncStorage.removeItem(key);
}

async function canUseSecureStore() {
  if (Platform.OS === "web") {
    return false;
  }

  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

function parseJson<T>(raw: string | null) {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
