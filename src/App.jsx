import "./App.css";
import Login from "../src/pages/Login";
import SignUp from "../src/pages/SignUp";
import { Routes, Route } from "react-router-dom";
import PasswordResetForm from "./pages/PasswordReset";
import ProtectedRoute from "./components/ProtectedRoutes";
import Dashboard from "./pages/Dashboard";
import NameChangeForm from "./components/NameChangeForm";
import DOBCorrectionForm from "./components/DOBCorrectionForm";
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
        <Route path="/NameChangeForm" element={<ProtectedRoute />}>
          <Route path="/NameChangeForm" element={<NameChangeForm />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
