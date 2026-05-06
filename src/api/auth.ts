import { apiFetch } from "./client";
import type { AuthResponse } from "../types";

export const authApi = {
  login(email: string, password: string) {
    return apiFetch<AuthResponse>("/auth/login", {
      auth: false,
      body: JSON.stringify({ email, password }),
      method: "POST",
    });
  },

  logout(refreshToken: string) {
    return apiFetch<void>("/auth/logout", {
      auth: false,
      body: JSON.stringify({ refreshToken }),
      method: "POST",
    });
  },
};
