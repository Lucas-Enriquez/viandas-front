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

  markPaid(orderId: string, paid: boolean, note?: string | null) {
    return apiFetch<OrderResponse>(`/orders/${orderId}/paid`, {
      body: JSON.stringify({ paid, note: note ?? undefined }),
      method: "PATCH",
    });
  },

  markMenuPreparing(menuId: string) {
    return apiFetch<OrderResponse[]>(`/menus/${menuId}/orders/preparing`, {
      method: "PATCH",
    });
  },
};
