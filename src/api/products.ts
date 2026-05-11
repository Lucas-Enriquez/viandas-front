import { apiFetch } from "./client";
import type {
  MenuItemCategory,
  Product,
  ProductRequest,
  UploadSignatureResponse,
} from "../types";

type ProductFilters = {
  category?: MenuItemCategory;
};

export const productsApi = {
  list(filters: ProductFilters = {}) {
    const params = new URLSearchParams();
    if (filters.category) {
      params.set("category", filters.category);
    }
    const query = params.toString();
    return apiFetch<Product[]>(`/products${query ? `?${query}` : ""}`);
  },

  get(id: string) {
    return apiFetch<Product>(`/products/${id}`);
  },

  create(body: ProductRequest) {
    return apiFetch<Product>("/products", {
      body: JSON.stringify(body),
      method: "POST",
    });
  },

  update(id: string, body: ProductRequest) {
    return apiFetch<Product>(`/products/${id}`, {
      body: JSON.stringify(body),
      method: "PATCH",
    });
  },

  delete(id: string) {
    return apiFetch<void>(`/products/${id}`, {
      method: "DELETE",
    });
  },

  signUpload() {
    return apiFetch<UploadSignatureResponse>("/products/uploads/sign", {
      method: "POST",
    });
  },
};
