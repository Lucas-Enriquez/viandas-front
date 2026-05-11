import { apiFetch } from "./client";
import type {
  MenuItemCategory,
  MenuItemResponse,
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

type AddMenuItemCommon = {
  availableCompanyIds?: string[];
  remainingStock?: number;
};

/** Item agregado desde el inventario (catálogo) — el backend snapshotea name/price/etc del Product. */
export type AddMenuItemFromCatalogBody = AddMenuItemCommon & {
  productId: string;
};

/** Item libre — name/price/category obligatorios, photoPublicId opcional. */
export type AddMenuItemFreeFormBody = AddMenuItemCommon & {
  name: string;
  price: number;
  category: MenuItemCategory;
  photoPublicId?: string;
};

export type AddMenuItemBody = AddMenuItemFromCatalogBody | AddMenuItemFreeFormBody;

type CloneMenuBody = {
  date: string;
  orderClosesAt?: string;
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

  get(menuId: string) {
    return apiFetch<MenuResponse>(`/menus/${menuId}`);
  },

  clone(menuId: string, body: CloneMenuBody) {
    return apiFetch<MenuResponse>(`/menus/${menuId}/clone`, {
      body: JSON.stringify(body),
      method: "POST",
    });
  },

  listItems(menuId: string) {
    return apiFetch<MenuItemResponse[]>(`/menus/${menuId}/items`);
  },

  removeItem(menuId: string, itemId: string) {
    return apiFetch<void>(`/menus/${menuId}/items/${itemId}`, { method: "DELETE" });
  },

  delete(menuId: string) {
    return apiFetch<void>(`/menus/${menuId}`, { method: "DELETE" });
  },
};
