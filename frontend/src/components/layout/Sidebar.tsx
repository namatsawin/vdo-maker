import { Link, useLocation } from 'react-router-dom';
import { Home, FolderOpen, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'System Instructions', href: '/system-instructions', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-72 border-r border-slate-200/60 bg-white/80 backdrop-blur-sm">
      <nav className="p-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'flex items-center space-x-4 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-soft-md'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5 transition-transform group-hover:scale-110',
                isActive ? 'text-white' : 'text-slate-500'
              )} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
