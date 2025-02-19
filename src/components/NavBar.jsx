import { Link } from "react-router-dom";

const NavBar = () => {
  return (
    <nav className="flex items-center justify-between p-4 bg-gray-800 text-white">
      <div className="flex items-center">
        <div className="text-xl font-bold">Memogen</div>
      </div>
      <div className="flex space-x-4">
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
    </nav>
  );
};

export default NavBar;
