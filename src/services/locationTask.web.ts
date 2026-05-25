import type { DeliverySessionResponse } from "../types";

export const DELIVERY_LOCATION_TASK = "viandas-delivery-location";

export async function startDeliveryTracking(_session: DeliverySessionResponse) {
  throw new Error("El reparto solo funciona en la app nativa.");
}

export async function stopDeliveryTracking() {}

export async function isDeliveryTrackingActive() {
  return false;
}
