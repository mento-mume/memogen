import { useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase.config"; // Import the auth object
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { GalleryVerticalEnd } from "lucide-react";
const PasswordResetForm = ({ className, ...props }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Send password reset email
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent. Check your inbox.");
    } catch (error) {
      console.error("Error sending password reset email:", error);
      setError("Failed to send password reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  //   return (
  //     <div>
  //       <h2>Reset Password</h2>
  //       <form onSubmit={handleSubmit}>
  //         <div>
  //           <label>Email:</label>
  //           <input
  //             type="email"
  //             value={email}
  //             onChange={(e) => setEmail(e.target.value)}
  //             required
  //           />
  //         </div>
  //         {message && <p style={{ color: "green" }}>{message}</p>}
  //         {error && <p style={{ color: "red" }}>{error}</p>}
  //         <button type="submit" disabled={loading}>
  //           {loading ? "Sending..." : "Reset Password"}
  //         </button>
  //       </form>
  //       <p>
  //         Remember your password? <a href="/signin">Sign In</a>
  //       </p>
  //     </div>
  //   );
  // };

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <GalleryVerticalEnd className="size-4" />
          </div>
          MemoGen
        </a>
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Forgot Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-6">
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  {message && <p style={{ color: "green" }}>{message}</p>}
                  {error && <p style={{ color: "red" }}>{error}</p>}
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Sending..." : "Reset Password"}
                  </Button>
                </div>
              </form>
              <p>
                Remember your password? <Link to="/">Sign In</Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
PasswordResetForm.propTypes = {
  className: PropTypes.string,
};
export default PasswordResetForm;
