import { Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { ClipboardCheck, Link2, LogOut, UserRound, Utensils } from "lucide-react-native";

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
            style={styles.logout}
          >
            <LogOut color={colors.muted} size={20} strokeWidth={2.4} />
          </Pressable>
        ),
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.surface },
        headerTitle: () => <Text style={styles.brand}>Caseritas</Text>,
        tabBarActiveTintColor: colors.brandRed,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          minHeight: 78,
          paddingBottom: 20,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="employee-menu"
        options={{
          tabBarIcon: ({ color }) => <Utensils color={color} size={22} />,
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
            <ClipboardCheck color={colors.onBrand} size={26} strokeWidth={2.6} />
          ),
          tabBarLabel: () => null,
          title: "Mi pedido",
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          tabBarIcon: ({ color }) => <UserRound color={color} size={22} />,
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
    height: 40,
    justifyContent: "center",
    marginRight: spacing.xs,
    width: 40,
  },
  centerTabButton: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    marginTop: -18,
  },
  centerTabButtonPressed: {
    opacity: 0.86,
  },
  centerTabCircle: {
    alignItems: "center",
    backgroundColor: colors.brandRed,
    borderColor: colors.surface,
    borderRadius: 999,
    borderWidth: 4,
    height: 62,
    justifyContent: "center",
    shadowColor: colors.shadow,
    shadowOffset: { height: 6, width: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    width: 62,
    elevation: 6,
  },
  centerTabLabel: {
    ...typography.captionStrong,
    color: colors.brandRed,
    marginTop: 2,
  },
});
