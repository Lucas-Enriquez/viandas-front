import { PropsWithChildren, useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";

import { meApi } from "../api/me";
import { useAuth } from "../auth/AuthContext";
import type { NotificationPlatform, UserRole } from "../types";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function platformName(): NotificationPlatform {
  if (Platform.OS === "android") return "ANDROID";
  if (Platform.OS === "ios") return "IOS";
  return "WEB";
}

function navigateForRole(role: UserRole | undefined) {
  if (role === "EMPLOYEE") {
    router.push("/employee-order");
  } else if (role === "COOK") {
    router.push("/orders");
  }
}

export function NotificationsProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const sessionId = session?.user.id;
  const roleRef = useRef<UserRole | undefined>(session?.user.role);
  roleRef.current = session?.user.role;

  useEffect(() => {
    if (!sessionId) {
      return;
    }
    let cancelled = false;

    async function register() {
      try {
        if (!Device.isDevice) {
          return;
        }

        const existing = await Notifications.getPermissionsAsync();
        let granted = existing.status === "granted";
        if (!granted) {
          const requested = await Notifications.requestPermissionsAsync();
          granted = requested.status === "granted";
        }
        if (cancelled || !granted) {
          return;
        }

        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            importance: Notifications.AndroidImportance.HIGH,
            name: "default",
          });
        }

        const tokenResult = await Notifications.getDevicePushTokenAsync();
        if (cancelled || !tokenResult?.data) {
          return;
        }

        await meApi.registerNotificationDevice(tokenResult.data, platformName());
      } catch (error) {
        console.warn("[Notifications] register failed:", error);
      }
    }

    register();

    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    let mounted = true;

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!mounted || !response) {
        return;
      }
      const data = response.notification.request.content.data as { orderId?: string } | undefined;
      if (data?.orderId) {
        navigateForRole(roleRef.current);
      }
    });

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { orderId?: string } | undefined;
      if (data?.orderId) {
        navigateForRole(roleRef.current);
      }
    });

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return <>{children}</>;
}
