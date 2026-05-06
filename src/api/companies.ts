import { apiFetch } from "./client";
import type { Company, CompanyRequest, LocationSource } from "../types";

type UpdateCompanyLocationBody = {
  address?: string | null;
  latitude: number;
  locationSource: LocationSource;
  longitude: number;
};

export const companiesApi = {
  list() {
    return apiFetch<Company[]>("/companies");
  },

  get(id: string) {
    return apiFetch<Company>(`/companies/${id}`);
  },

  create(body: CompanyRequest) {
    return apiFetch<Company>("/companies", {
      body: JSON.stringify(body),
      method: "POST",
    });
  },

  update(id: string, body: CompanyRequest) {
    return apiFetch<Company>(`/companies/${id}`, {
      body: JSON.stringify(body),
      method: "PATCH",
    });
  },

  updateLocation(id: string, body: UpdateCompanyLocationBody) {
    return apiFetch<Company>(`/companies/${id}/location`, {
      body: JSON.stringify(body),
      method: "PATCH",
    });
  },
};
