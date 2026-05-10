import { Redirect } from "expo-router";

import { useAuth } from "../src/auth/AuthContext";
import { LoadingState } from "../src/components/StateViews";

export default function IndexScreen() {
  const { isLoading, session } = useAuth();

  if (isLoading) {
    return <LoadingState label="Cargando Caseritas..." />;
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return (
    <Redirect href={session.user.role === "EMPLOYEE" ? "/employee-menu" : "/menus"} />
  );
}
