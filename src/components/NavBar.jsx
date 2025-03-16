import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { UserIcon, LogOutIcon, MenuIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const NavBar = () => {
  const [username, setUsername] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  // Function to get initials from username
  const getInitials = () => {
    if (!username) return "U";

    const parts = username.split(/[@\s.]/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <nav className="flex items-center justify-between p-4 bg-gray-800 text-white">
      <div className="flex items-center">
        <div className="text-xl font-bold">Memogen</div>
      </div>

      {/* Desktop navigation links */}
      <div className="hidden md:flex space-x-4">
        <Link to="/" className="hover:text-gray-400">
          Home
        </Link>
        <Link to="/create-memo" className="hover:text-gray-400">
          Create Memo
        </Link>
        <Link to="/templates" className="hover:text-gray-400">
          Templates
        </Link>
      </div>

      {/* User account section */}
      <div className="flex items-center gap-2">
        {username && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center justify-start gap-2 p-2">
                <UserIcon className="h-4 w-4" />
                <span className="font-medium">{username}</span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={onLogout}
                className="text-red-500 cursor-pointer"
              >
                <LogOutIcon className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <MenuIcon className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile navigation menu */}
      {isMenuOpen && (
        <div className="absolute top-16 right-4 bg-gray-700 p-4 rounded-md shadow-lg md:hidden z-50">
          <div className="flex flex-col space-y-3">
            <Link to="/" className="hover:text-gray-400">
              Home
            </Link>
            <Link to="/create-memo" className="hover:text-gray-400">
              Create Memo
            </Link>
            <Link to="/templates" className="hover:text-gray-400">
              Templates
            </Link>
            {username && (
              <>
                <div className="border-t border-gray-600 pt-2"></div>
                <button
                  onClick={onLogout}
                  className="text-red-400 hover:text-red-300 text-left flex items-center"
                >
                  <LogOutIcon className="h-4 w-4 mr-2" />
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
