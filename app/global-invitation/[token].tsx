import { Redirect, useLocalSearchParams } from "expo-router";

export default function GlobalInvitationDeepLink() {
  const { token } = useLocalSearchParams<{ token: string }>();

  return (
    <Redirect href={{ pathname: "/invitation", params: { token, kind: "global" } }} />
  );
}
