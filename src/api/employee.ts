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
  menu(date: string) {
    return apiFetch<PublicMenuResponse>(`/employee/menus/${date}`);
  },

  currentOrder(date: string) {
    return apiFetch<CurrentOrderResponse>(`/employee/menus/${date}/orders/current`);
  },

  createOrder(date: string, body: CreateOrderBody) {
    return apiFetch<OrderResponse>(`/employee/menus/${date}/orders`, {
      body: JSON.stringify(body),
      method: "POST",
    });
  },
};
