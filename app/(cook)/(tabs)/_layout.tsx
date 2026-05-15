import { View } from "react-native";
import { Tabs } from "expo-router";
import {
  ChefHat,
  ClipboardList,
  MenuSquare,
  Truck,
  UserRound,
} from "lucide-react-native";

import { FloatingTabBar, FLOATING_BAR_BOTTOM_OFFSET } from "../../../src/components/FloatingTabBar";
import { colors } from "../../../src/theme";

export default function CookTabsLayout() {
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
              <MenuSquare color={color} size={size} strokeWidth={1.8} />
            ),
            title: "Menús",
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            tabBarIcon: ({ color, size }) => (
              <ChefHat color={color} size={size} strokeWidth={1.8} />
            ),
            title: "Productos",
          }}
        />
        <Tabs.Screen name="companies" options={{ href: null }} />
        <Tabs.Screen
          name="delivery"
          options={{
            tabBarIcon: ({ color, size }) => (
              <Truck color={color} size={size} strokeWidth={1.8} />
            ),
            title: "Reparto",
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            tabBarIcon: ({ color, size }) => (
              <ClipboardList color={color} size={size} strokeWidth={1.8} />
            ),
            title: "Pedidos",
          }}
        />
        <Tabs.Screen
          name="cuenta"
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
