import { Pressable, StyleSheet, Text } from "react-native";
import { Redirect, Tabs } from "expo-router";
import {
  Building2,
  ClipboardList,
  LogOut,
  MenuSquare,
  Truck,
} from "lucide-react-native";

import { useAuth } from "../../src/auth/AuthContext";
import { LoadingState } from "../../src/components/StateViews";
import { colors, spacing, typography } from "../../src/theme";

export default function CookLayout() {
  const { isLoading, session, signOut } = useAuth();

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
    <Tabs
      screenOptions={{
        headerRight: () => (
          <Pressable
            accessibilityLabel="Cerrar sesión"
            hitSlop={10}
            onPress={signOut}
            style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}
          >
            <LogOut color={colors.muted} size={20} strokeWidth={2.4} />
          </Pressable>
        ),
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTitle: () => <Text style={styles.brand}>Caseritas</Text>,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.brandRed,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          ...typography.captionStrong,
          textTransform: "uppercase",
        },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          minHeight: 80,
          paddingBottom: 22,
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="companies"
        options={{
          tabBarIcon: ({ color }) => <Building2 color={color} size={22} strokeWidth={2.4} />,
          title: "Empresas",
        }}
      />
      <Tabs.Screen
        name="menus"
        options={{
          tabBarIcon: ({ color }) => <MenuSquare color={color} size={22} strokeWidth={2.4} />,
          title: "Menús",
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ color }) => <ClipboardList color={color} size={22} strokeWidth={2.4} />,
          title: "Pedidos",
        }}
      />
      <Tabs.Screen
        name="delivery"
        options={{
          tabBarIcon: ({ color }) => <Truck color={color} size={22} strokeWidth={2.4} />,
          title: "Reparto",
        }}
      />
      <Tabs.Screen name="company-form" options={{ href: null }} />
      <Tabs.Screen name="menu-create" options={{ href: null }} />
      <Tabs.Screen name="map-picker" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  brand: {
    ...typography.brand,
    color: colors.brandRed,
  },
  logout: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: 999,
    height: 40,
    justifyContent: "center",
    marginRight: spacing.md,
    width: 40,
  },
  logoutPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
});
