import { apiFetch } from "./client";
import type {
  AuthResponse,
  GlobalInvitationPreviewResponse,
  InvitationValidationResponse,
} from "../types";

type AcceptInvitationBody = {
  email: string;
  name: string;
  password: string;
};

export const invitationsApi = {
  previewIndividual(token: string) {
    return apiFetch<InvitationValidationResponse>(`/invitations/${token}`, {
      auth: false,
    });
  },

  acceptIndividual(token: string, body: AcceptInvitationBody) {
    return apiFetch<AuthResponse>(`/invitations/${token}/accept`, {
      auth: false,
      body: JSON.stringify(body),
      method: "POST",
    });
  },

  previewGlobal(token: string) {
    return apiFetch<GlobalInvitationPreviewResponse>(`/global-invitation/${token}`, {
      auth: false,
    });
  },

  acceptGlobal(token: string, body: AcceptInvitationBody) {
    return apiFetch<AuthResponse>(`/global-invitation/${token}/accept`, {
      auth: false,
      body: JSON.stringify(body),
      method: "POST",
    });
  },
};
