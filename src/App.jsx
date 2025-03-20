import "./App.css";
import Login from "../src/pages/Login";
import SignUp from "../src/pages/SignUp";
import { Routes, Route, Outlet } from "react-router-dom";
import PasswordResetForm from "./pages/PasswordReset";
import ProtectedRoute from "./components/ProtectedRoutes";
import Dashboard from "./pages/Dashboard";
import NameChangeForm from "./components/NameChangeForm";
import RestorationMigrationForm from "./components/RestorationMigrationForm";
import DOBCorrectionForm from "./components/DOBCorrectionForm";
import DOFACorrectionForm from "./components/DOFACorrectionForm";
import NextOfKinChangeForm from "./components/NextOfKinChangeForm";
import NavBar from "./components/NavBar";

// Layout component that includes NavBar
const Layout = () => {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  );
};

function App() {
  return (
    <>
      <Routes>
        {/* Public routes without NavBar */}
        <Route path="/" element={<Login />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/PasswordReset" element={<PasswordResetForm />} />

        {/* Protected routes with NavBar layout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/Dashboard" element={<Dashboard />} />
            <Route path="/DOBCorrectionForm" element={<DOBCorrectionForm />} />
            <Route
              path="/DOFACorrectionForm"
              element={<DOFACorrectionForm />}
            />
            <Route
              path="/RestorationMigrationForm"
              element={<RestorationMigrationForm />}
            />
            <Route path="/NameChangeForm" element={<NameChangeForm />} />
            <Route
              path="/NextOfKinChangeForm"
              element={<NextOfKinChangeForm />}
            />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
