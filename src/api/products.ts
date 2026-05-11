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

  async uploadPhoto(imageUri: string): Promise<string> {
    const sig = await productsApi.signUpload();

    const form = new FormData();
    form.append("file", { uri: imageUri, type: "image/jpeg", name: "photo.jpg" } as unknown as Blob);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("folder", sig.folder);
    form.append("signature", sig.signature);

    const res = await fetch(sig.uploadUrl, { method: "POST", body: form });
    if (!res.ok) throw new Error("No se pudo subir la imagen a Cloudinary.");
    const data = await res.json() as { public_id: string };
    return data.public_id;
  },
};
