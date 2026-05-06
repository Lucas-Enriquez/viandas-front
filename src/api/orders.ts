import { apiFetch } from "./client";
import type { OrderResponse } from "../types";

export type OrderAction = "preparing" | "out-for-delivery" | "delivered" | "cancel";

export const ordersApi = {
  today() {
    return apiFetch<OrderResponse[]>("/orders/today");
  },

  updateStatus(orderId: string, action: OrderAction) {
    return apiFetch<OrderResponse>(`/orders/${orderId}/${action}`, {
      method: "PATCH",
    });
  },
};
