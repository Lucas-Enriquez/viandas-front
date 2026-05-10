import { apiFetch } from "./client";
import type {
  Company,
  CompanyRequest,
  GlobalInvitationPreviewResponse,
  GlobalInvitationResponse,
  LocationSource,
} from "../types";

type UpdateCompanyLocationBody = {
  address?: string | null;
  latitude: number;
  locationSource: LocationSource;
  longitude: number;
};

type CreateGlobalInvitationBody = {
  maxUses: number | null;
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

  delete(id: string) {
    return apiFetch<void>(`/companies/${id}`, {
      method: "DELETE",
    });
  },

  getGlobalInvitation(id: string) {
    return apiFetch<GlobalInvitationPreviewResponse>(
      `/companies/${id}/global-invitation`,
    );
  },

  createGlobalInvitation(id: string, body: CreateGlobalInvitationBody) {
    return apiFetch<GlobalInvitationResponse>(`/companies/${id}/global-invitation`, {
      body: JSON.stringify(body),
      method: "POST",
    });
  },
};
