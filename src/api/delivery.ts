import { apiFetch } from "./client";
import type { DeliverySessionResponse } from "../types";

type StartDeliveryBody = {
  companyId: string;
  menuId: string;
};

type UpdateLocationBody = {
  accuracyMeters?: number;
  latitude: number;
  longitude: number;
};

export const deliveryApi = {
  start(body: StartDeliveryBody) {
    return apiFetch<DeliverySessionResponse>("/delivery-sessions", {
      body: JSON.stringify(body),
      method: "POST",
    });
  },

  updateLocation(sessionId: string, body: UpdateLocationBody) {
    return apiFetch<DeliverySessionResponse>(`/delivery-sessions/${sessionId}/location`, {
      body: JSON.stringify(body),
      method: "PATCH",
    });
  },

  finish(sessionId: string) {
    return apiFetch<DeliverySessionResponse>(`/delivery-sessions/${sessionId}/finish`, {
      method: "POST",
    });
  },
};
