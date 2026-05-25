import { Platform } from "react-native";
import { Redirect, Stack } from "expo-router";

import { useAuth } from "../../src/auth/AuthContext";
import { LoadingState } from "../../src/components/StateViews";
import { NativeOnlyGate } from "../../src/components/NativeOnlyGate";
import { CookRealtimeProvider } from "../../src/providers/CookRealtimeProvider";
import { colors } from "../../src/theme";

export default function CookLayout() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return <LoadingState label="Preparando tu sesión..." />;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (Platform.OS === "web") {
    return <NativeOnlyGate />;
  }

  if (session.user.role === "EMPLOYEE") {
    return <Redirect href="/employee-menu" />;
  }

  return (
    <CookRealtimeProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </CookRealtimeProvider>
  );
}
