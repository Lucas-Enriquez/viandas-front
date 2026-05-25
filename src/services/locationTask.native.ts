import { Platform } from "react-native";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { ApiError } from "../api/client";
import { deliveryApi } from "../api/delivery";
import { clearActiveDelivery, getActiveDelivery, setActiveDelivery } from "../storage";
import { colors } from "../theme";
import type { DeliverySessionResponse } from "../types";

export const DELIVERY_LOCATION_TASK = "viandas-delivery-location";

type LocationTaskData = {
  locations?: Location.LocationObject[];
};

if (Platform.OS !== "web" && !TaskManager.isTaskDefined(DELIVERY_LOCATION_TASK)) {
  TaskManager.defineTask(DELIVERY_LOCATION_TASK, async ({ data, error }) => {
    if (error) {
      return;
    }

    const activeDelivery = await getActiveDelivery();
    const locations = (data as LocationTaskData | undefined)?.locations;
    const latestLocation = locations?.[locations.length - 1];

    if (!activeDelivery || !latestLocation) {
      return;
    }

    const { accuracy, latitude, longitude } = latestLocation.coords;

    try {
      const updatedSession = await deliveryApi.updateLocation(activeDelivery.session.id, {
        accuracyMeters: typeof accuracy === "number" ? Math.round(accuracy) : undefined,
        latitude,
        longitude,
      });

      await setActiveDelivery({
        ...activeDelivery,
        session: updatedSession,
        updatedAt: new Date().toISOString(),
      });
    } catch (taskError) {
      if (taskError instanceof ApiError && taskError.status === 409) {
        await stopDeliveryTracking();
      }
    }
  });
}

export async function startDeliveryTracking(session: DeliverySessionResponse) {
  await setActiveDelivery({
    session,
    startedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== Location.PermissionStatus.GRANTED) {
    throw new Error("Necesitamos permiso de ubicación para iniciar el tracking.");
  }

  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== Location.PermissionStatus.GRANTED) {
    throw new Error("Necesitamos permiso de ubicación en segundo plano para el reparto.");
  }

  const alreadyStarted = await isDeliveryTrackingActive();
  if (alreadyStarted) {
    return;
  }

  await Location.startLocationUpdatesAsync(DELIVERY_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    activityType: Location.ActivityType.AutomotiveNavigation,
    deferredUpdatesInterval: 10_000,
    distanceInterval: 0,
    foregroundService: {
      killServiceOnDestroy: false,
      notificationBody: "Compartiendo ubicación del reparto activo.",
      notificationColor: colors.brandRed,
      notificationTitle: "Viandas: reparto activo",
    },
    pausesUpdatesAutomatically: false,
    showsBackgroundLocationIndicator: true,
    timeInterval: 10_000,
  });
}

export async function stopDeliveryTracking() {
  const alreadyStarted = await isDeliveryTrackingActive();
  if (alreadyStarted) {
    await Location.stopLocationUpdatesAsync(DELIVERY_LOCATION_TASK);
  }
  await clearActiveDelivery();
}

export async function isDeliveryTrackingActive() {
  try {
    return await Location.hasStartedLocationUpdatesAsync(DELIVERY_LOCATION_TASK);
  } catch {
    return false;
  }
}
