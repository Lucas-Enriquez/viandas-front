import { apiFetch } from "./client";
import type { UserContextResponse } from "../types";

export const meApi = {
  context() {
    return apiFetch<UserContextResponse>("/me/context");
  },
};
