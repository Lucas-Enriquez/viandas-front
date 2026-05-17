import { PropsWithChildren, useEffect } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { useAuth } from "../auth/AuthContext";
import { API_URL } from "../config";
import { SSEClient } from "../services/sseClient";
import {
  clearActiveDelivery,
  getActiveDelivery,
  getAuthSession,
  setActiveDelivery,
} from "../storage";
import type { DeliverySessionResponse } from "../types";

export function CookRealtimeProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const queryClient = useQueryClient();

  const isCook = session?.user.role === "COOK";
  const userId = session?.user.id;

  useEffect(() => {
    if (!isCook) {
      return;
    }

    const client = new SSEClient({
      url: `${API_URL}/orders/stream`,
      getToken: async () => (await getAuthSession())?.accessToken ?? null,
    });

    const invalidateOrders = () =>
      queryClient.invalidateQueries({ queryKey: ["orders", "today"] });
    const invalidateDelivery = () =>
      queryClient.invalidateQueries({ queryKey: ["delivery", "active"] });

    client.on("order.created", invalidateOrders);
    client.on("order.updated", invalidateOrders);

    client.on("delivery.started", async (payload: DeliverySessionResponse) => {
      const existing = await getActiveDelivery();
      await setActiveDelivery({
        session: payload,
        startedAt: existing?.startedAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      invalidateDelivery();
      invalidateOrders();
    });

    client.on("delivery.location", async (payload: DeliverySessionResponse) => {
      const existing = await getActiveDelivery();
      if (!existing) {
        return;
      }
      await setActiveDelivery({
        ...existing,
        session: payload,
        updatedAt: new Date().toISOString(),
      });
      invalidateDelivery();
    });

    client.on("delivery.finished", async () => {
      await clearActiveDelivery();
      invalidateDelivery();
      invalidateOrders();
    });

    client.on("stock.broadcast", () => {
      queryClient.invalidateQueries({ queryKey: ["menus"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    });

    client.start();

    const handleAppStateChange = (status: AppStateStatus) => {
      if (status === "active") {
        client.start();
      } else {
        client.stop();
      }
    };

    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      subscription.remove();
      client.stop();
    };
  }, [isCook, queryClient, userId]);

  return <>{children}</>;
}
