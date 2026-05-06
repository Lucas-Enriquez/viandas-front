import { apiFetch } from "./client";
import type { CurrentOrderResponse, OrderResponse, PublicMenuResponse } from "../types";

type CreateOrderBody = {
  items: {
    comment?: string | null;
    menuItemId: string;
    quantity: number;
  }[];
};

export const employeeApi = {
  globalMenu(date: string, token: string) {
    return apiFetch<PublicMenuResponse>(
      `/employee/menus/global/${date}?t=${encodeURIComponent(token)}`,
    );
  },

  currentGlobalOrder(date: string, token: string) {
    return apiFetch<CurrentOrderResponse>(
      `/employee/menus/global/${date}/orders/current?t=${encodeURIComponent(token)}`,
    );
  },

  createGlobalOrder(date: string, token: string, body: CreateOrderBody) {
    return apiFetch<OrderResponse>(
      `/employee/menus/global/${date}/orders?t=${encodeURIComponent(token)}`,
      {
        body: JSON.stringify(body),
        method: "POST",
      },
    );
  },
};
