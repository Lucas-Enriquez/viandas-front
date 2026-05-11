import { View } from "react-native";
import { Redirect, Tabs } from "expo-router";
import {
  ChefHat,
  ClipboardList,
  MenuSquare,
  Truck,
  UserRound,
} from "lucide-react-native";

import { useAuth } from "../../src/auth/AuthContext";
import { FloatingTabBar, FLOATING_BAR_BOTTOM_OFFSET } from "../../src/components/FloatingTabBar";
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
    <View style={{ flex: 1 }}>
    <Tabs
      initialRouteName="menus"
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background, paddingBottom: FLOATING_BAR_BOTTOM_OFFSET },
      }}
    >
      <Tabs.Screen
        name="menus"
        options={{
          tabBarIcon: ({ color, size }) => (
            <MenuSquare color={color} size={size} strokeWidth={2.4} />
          ),
          title: "Menús",
        }}
      />

      <Tabs.Screen
        name="products"
        options={{
          tabBarIcon: ({ color, size }) => (
            <ChefHat color={color} size={size} strokeWidth={2.4} />
          ),
          title: "Productos",
        }}
      />
      <Tabs.Screen name="companies" options={{ href: null }} />
      <Tabs.Screen
        name="delivery"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Truck color={color} size={size} strokeWidth={2.4} />
          ),
          title: "Reparto",
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          tabBarIcon: ({ color, size }) => (
            <ClipboardList color={color} size={size} strokeWidth={2.4} />
          ),
          title: "Pedidos",
        }}
      />
      <Tabs.Screen
        name="cuenta"
        options={{
          tabBarIcon: ({ color, size }) => (
            <UserRound color={color} size={size} strokeWidth={2.4} />
          ),
          title: "Cuenta",
        }}
      />
      <Tabs.Screen name="(forms)" options={{ href: null }} />
    </Tabs>
    </View>
  );
}
