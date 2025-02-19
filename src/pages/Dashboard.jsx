import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import NavBar from "@/components/NavBar";

const Dashboard = () => {
  const [username, setUsername] = useState("");
  const auth = getAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    auth.signOut();
    navigate("/");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUsername(user.displayName || user.email);
      } else {
        setUsername("");
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <NavBar />
      <div className="p-4">
        <h1>Welcome, {username}</h1>
        <div>Dashboard</div>
        <div className="grid gap-4 mt-4">
          <Link to="/DOBCorrectionForm" className="w-full">
            <Button variant="primary" size="lg" className="w-full">
              DOB
            </Button>
          </Link>
          <Button variant="primary" size="lg" className="w-full">
            DOFA
          </Button>
          <Link to="/NameChangeForm" className="w-full">
            <Button variant="primary" size="lg" className="w-full">
              CON
            </Button>
          </Link>
          <Button variant="primary" size="lg" className="w-full">
            Migration
          </Button>
        </div>
        <Button variant="destructive" onClick={onLogout} className="mt-4">
          Logout
        </Button>
      </div>
    </>
  );
};

export default Dashboard;
