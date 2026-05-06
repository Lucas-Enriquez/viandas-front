import { apiFetch } from "./client";
import type {
  MenuItemCategory,
  MenuResponse,
  MenuScope,
  ShareMessageResponse,
} from "../types";

type MenuFilters = {
  companyId?: string;
  date?: string;
};

type CreateMenuBody = {
  companyId?: string;
  companyIds?: string[];
  date: string;
  orderClosesAt: string;
  scope?: MenuScope;
};

type AddMenuItemBody = {
  availableCompanyIds?: string[];
  category: MenuItemCategory;
  name: string;
  photoUrl?: string;
  price: number;
  remainingStock?: number;
};

export const menusApi = {
  list(filters: MenuFilters = {}) {
    const params = new URLSearchParams();
    if (filters.companyId) {
      params.set("companyId", filters.companyId);
    }
    if (filters.date) {
      params.set("date", filters.date);
    }

    const query = params.toString();
    return apiFetch<MenuResponse[]>(`/menus${query ? `?${query}` : ""}`);
  },

  create(body: CreateMenuBody) {
    return apiFetch<MenuResponse>("/menus", {
      body: JSON.stringify(body),
      method: "POST",
    });
  },

  addItem(menuId: string, body: AddMenuItemBody) {
    return apiFetch<unknown>(`/menus/${menuId}/items`, {
      body: JSON.stringify(body),
      method: "POST",
    });
  },

  publish(menuId: string) {
    return apiFetch<ShareMessageResponse>(`/menus/${menuId}/publish`, {
      method: "PATCH",
    });
  },

  shareMessage(menuId: string) {
    return apiFetch<ShareMessageResponse>(`/menus/${menuId}/share-message`);
  },
};
