
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-white text-lg font-bold">
          Home
        </Link>
        <div className="flex space-x-4">
          <Link href="/chat" className="text-gray-300 hover:text-white">
            Chat
          </Link>
          <Link href="/register" className="text-gray-300 hover:text-white">
            Register
          </Link>
          <Link href="/results" className="text-gray-300 hover:text-white">
            Results
          </Link>
          <Link href="/test" className="text-gray-300 hover:text-white">
            Test
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
