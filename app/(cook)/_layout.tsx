import { Redirect, Stack } from "expo-router";

import { useAuth } from "../../src/auth/AuthContext";
import { LoadingState } from "../../src/components/StateViews";
import { colors } from "../../src/theme";

export default function CookLayout() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return <LoadingState label="Preparando tu sesión..." />;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (session.user.role === "EMPLOYEE") {
    return <Redirect href="/employee-menu" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
