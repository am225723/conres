import { Link, useLocation } from 'react-router-dom';
import { Heart, Target, Users, Lightbulb, Laptop as NotebookPen, Trophy, BarChart3 } from 'lucide-react';

export const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Builder', icon: Target },
    { path: '/emotions', label: 'Emotions', icon: Heart },
    { path: '/roleplay', label: 'Role-Play', icon: Users },
    { path: '/couples', label: 'Couples', icon: Users },
    { path: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/exercises', label: 'Exercises', icon: Lightbulb },
    { path: '/journal', label: 'Journal', icon: NotebookPen },
    { path: '/history', label: 'History', icon: Trophy },
  ];

  return (
    <nav className="w-full max-w-6xl mx-auto mb-6">
      <div className="bg-card rounded-lg p-2 grid grid-cols-4 md:grid-cols-8 gap-2">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              className={`
                flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium
                transition-colors
                ${isActive 
                  ? 'bg-primary text-primary-foreground' 
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
