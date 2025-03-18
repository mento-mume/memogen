import "./App.css";
import Login from "../src/pages/Login";
import SignUp from "../src/pages/SignUp";
import { Routes, Route } from "react-router-dom";
import PasswordResetForm from "./pages/PasswordReset";
import ProtectedRoute from "./components/ProtectedRoutes";
import Dashboard from "./pages/Dashboard";
import NameChangeForm from "./components/NameChangeForm";
import RestorationMigrationForm from "./components/RestorationMigrationForm";
import DOBCorrectionForm from "./components/DOBCorrectionForm";
import DOFACorrectionForm from "./components/DOFACorrectionForm";
import NextOfKinChangeForm from "./components/NextOfKinChangeForm";
function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/SignUp" element={<SignUp />} />
        <Route path="/PasswordReset" element={<PasswordResetForm />} />
        <Route path="/Dashboard" element={<ProtectedRoute />}>
          <Route path="/Dashboard" element={<Dashboard />} />
        </Route>
        <Route path="/DOBCorrectionForm" element={<ProtectedRoute />}>
          <Route path="/DOBCorrectionForm" element={<DOBCorrectionForm />} />
        </Route>
        <Route path="/DOFACorrectionForm" element={<ProtectedRoute />}>
          <Route path="/DOFACorrectionForm" element={<DOFACorrectionForm />} />
        </Route>
        <Route path="/RestorationMigrationForm" element={<ProtectedRoute />}>
          <Route
            path="/RestorationMigrationForm"
            element={<RestorationMigrationForm />}
          />
        </Route>

        <Route path="/NameChangeForm" element={<ProtectedRoute />}>
          <Route path="/NameChangeForm" element={<NameChangeForm />} />
        </Route>
        <Route path="/NextOfKinChangeForm" element={<ProtectedRoute />}>
          <Route
            path="/NextOfKinChangeForm"
            element={<NextOfKinChangeForm />}
          />
        </Route>
      </Routes>
    </>
  );
}

export default App;
