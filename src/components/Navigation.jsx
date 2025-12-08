import { Link, useLocation } from 'react-router-dom';
import { Heart, Target, Users, Lightbulb, Laptop as NotebookPen, Trophy, BarChart3, Sparkles, Bot, MessageSquare } from 'lucide-react';

export const Navigation = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Builder', icon: Target },
    { path: '/ai-builder', label: 'AI Builder', icon: Sparkles },
    { path: '/emotions', label: 'Emotions', icon: Heart },
    { path: '/roleplay', label: 'Role-Play', icon: Users },
    { path: '/ai-roleplay', label: 'AI Practice', icon: Bot },
    { path: '/couples', label: 'Couples', icon: MessageSquare },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/exercises', label: 'Exercises', icon: Lightbulb },
    { path: '/journal', label: 'Journal', icon: NotebookPen },
    { path: '/history', label: 'History', icon: Trophy },
  ];

  return (
    <nav className="w-full max-w-6xl mx-auto mb-6">
      <div className="bg-card rounded-lg p-2 overflow-x-auto">
        <div className="flex gap-1 min-w-max md:grid md:grid-cols-10 md:gap-2">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
            return (
              <Link
                key={path}
                to={path}
                className={`
                  flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium
                  transition-colors whitespace-nowrap
                  ${isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
