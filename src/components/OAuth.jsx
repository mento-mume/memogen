import { useNavigate, useLocation } from "react-router-dom";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { db } from "@/firebase.config";
import { getDoc, setDoc, doc } from "firebase/firestore";
import { Button } from "@/components/ui/button";

const OAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const handleGoogleSignIn = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          // Uncomment the following lines if you want to store additional user information
          // name: user.displayName,
          // photoURL: user.photoURL,
        });
      }
      navigate("/dashboard");
    } catch (error) {
      console.error("Error during Google sign-in:", error);
    }
  };

  return (
    <Button variant="outline" className="w-full" onClick={handleGoogleSignIn}>
      {location.pathname === "/"
        ? "Login in with Google"
        : "Sign up with Google"}
    </Button>
  );
};

export default OAuth;
