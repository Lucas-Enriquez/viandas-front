import { Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { ClipboardCheck, LogOut, UserRound, Utensils } from "lucide-react-native";

import { useAuth } from "../../src/auth/AuthContext";
import { LoadingState } from "../../src/components/StateViews";
import { colors, spacing, typography } from "../../src/theme";

export default function EmployeeLayout() {
  const { isLoading, session, signOut } = useAuth();

  if (isLoading) {
    return <LoadingState label="Preparando tu sesión..." />;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (session.user.role !== "EMPLOYEE") {
    return <Redirect href="/companies" />;
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
        name="employee-menu"
        options={{
          tabBarIcon: ({ color }) => <Utensils color={color} size={22} strokeWidth={2.4} />,
          title: "Menú",
        }}
      />
      <Tabs.Screen
        name="employee-order"
        options={{
          tabBarButton: (props) => (
            <Pressable
              accessibilityLabel={props.accessibilityLabel}
              accessibilityRole="button"
              accessibilityState={props.accessibilityState}
              onPress={props.onPress}
              testID={props.testID}
              style={({ pressed }) => [
                styles.centerTabButton,
                pressed ? styles.centerTabButtonPressed : null,
              ]}
            >
              <View style={styles.centerTabCircle}>{props.children}</View>
              <Text style={styles.centerTabLabel}>Pedido</Text>
            </Pressable>
          ),
          tabBarIcon: () => (
            <ClipboardCheck color={colors.onBrand} size={28} strokeWidth={2.6} />
          ),
          tabBarLabel: () => null,
          title: "Mi pedido",
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          tabBarIcon: ({ color }) => <UserRound color={color} size={22} strokeWidth={2.4} />,
          title: "Cuenta",
        }}
      />
      <Tabs.Screen name="global-token" options={{ href: null }} />
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
  centerTabButton: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    marginTop: -22,
  },
  centerTabButtonPressed: {
    opacity: 0.86,
    transform: [{ scale: 0.94 }],
  },
  centerTabCircle: {
    alignItems: "center",
    backgroundColor: colors.brandRed,
    borderColor: colors.background,
    borderRadius: 999,
    borderWidth: 4,
    elevation: 8,
    height: 66,
    justifyContent: "center",
    shadowColor: colors.brandRed,
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    width: 66,
  },
  centerTabLabel: {
    ...typography.captionStrong,
    color: colors.brandRed,
    marginTop: 4,
    textTransform: "uppercase",
  },
});
