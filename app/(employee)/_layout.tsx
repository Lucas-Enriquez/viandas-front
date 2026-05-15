import { View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import { ClipboardCheck, UserRound, Utensils } from "lucide-react-native";

import { useAuth } from "../../src/auth/AuthContext";
import { FloatingTabBar, FLOATING_BAR_BOTTOM_OFFSET } from "../../src/components/FloatingTabBar";
import { LoadingState } from "../../src/components/StateViews";
import { colors } from "../../src/theme";

export default function EmployeeLayout() {
  const { isLoading, session } = useAuth();

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
    <View style={{ flex: 1 }}>
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="employee-menu"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Utensils color={color} size={size} strokeWidth={1.8} />
          ),
          title: "Menú",
        }}
      />
      <Tabs.Screen
        name="employee-order"
        options={{
          tabBarIcon: ({ color, size }) => (
            <ClipboardCheck color={color} size={size} strokeWidth={1.8} />
          ),
          title: "Mi pedido",
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          tabBarIcon: ({ color, size }) => (
            <UserRound color={color} size={size} strokeWidth={1.8} />
          ),
          title: "Cuenta",
        }}
      />
    </Tabs>
    </View>
  );
}
