import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const Dashboard = () => {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const auth = getAuth();
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
    <div>
      <h1>Welcome, {username}</h1>
      <div>Dashboard</div>
    </div>
  );
};

export default Dashboard;
