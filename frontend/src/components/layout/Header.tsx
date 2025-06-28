import { Link } from 'react-router-dom';
import { Video, User } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center px-6">
        <Link to="/" className="flex items-center space-x-2">
          <Video className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">VDO Maker</span>
        </Link>

        <div className="ml-auto flex items-center space-x-4">
          <nav className="flex items-center space-x-6">
            <Link
              to="/"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Dashboard
            </Link>
            <Link
              to="/projects"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Projects
            </Link>
          </nav>

          <div className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span className="text-sm">Demo User</span>
          </div>
        </div>
      </div>
    </header>
  );
}
