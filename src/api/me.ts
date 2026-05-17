import { apiFetch } from "./client";
import type {
  NotificationDeviceResponse,
  NotificationPlatform,
  UserContextResponse,
} from "../types";

export const meApi = {
  context() {
    return apiFetch<UserContextResponse>("/me/context");
  },

  registerNotificationDevice(token: string, platform: NotificationPlatform) {
    return apiFetch<NotificationDeviceResponse>("/me/notification-devices", {
      body: JSON.stringify({ token, platform }),
      method: "POST",
    });
  },
};
