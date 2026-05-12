import { Redirect, useLocalSearchParams } from "expo-router";

export default function GlobalMenuDeepLink() {
  const { date } = useLocalSearchParams<{ date: string }>();

  return <Redirect href={{ pathname: "/employee-menu", params: { date } }} />;
}
