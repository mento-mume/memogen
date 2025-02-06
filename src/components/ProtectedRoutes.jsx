import { Navigate, Outlet } from "react-router-dom";
import { useAuthStatus } from "../Hooks/useAuthStatus";

const ProtectedRoute = () => {
  const { loggedIn, checkingStatus } = useAuthStatus();

  if (checkingStatus) {
    return <p>loading...</p>;
  }
  return loggedIn ? <Outlet /> : <Navigate to="/" />;
};
export default ProtectedRoute;
