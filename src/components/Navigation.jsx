import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Target, Users, Lightbulb, Laptop as NotebookPen, Trophy, BarChart3, Sparkles, Bot, MessageSquare, ChevronLeft, ChevronRight, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Navigation = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
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

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      <button
        onClick={toggleMobile}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-lg shadow-lg border border-border"
      >
        <Menu className="w-6 h-6 text-foreground" />
      </button>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={toggleMobile}
          />
        )}
      </AnimatePresence>

      <motion.nav
        initial={false}
        animate={{ 
          width: isCollapsed ? 72 : 240,
          x: isMobileOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 768 ? -240 : 0)
        }}
        className={`
          fixed left-0 top-0 h-full z-50 md:z-30
          bg-card border-r border-border shadow-lg
          flex flex-col
          transition-transform md:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ width: isCollapsed ? 72 : 240 }}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-bold text-lg text-primary"
            >
              Menu
            </motion.span>
          )}
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-lg hover:bg-accent transition-colors hidden md:block"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-foreground" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="space-y-1 px-3">
            {navItems.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
              return (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-3 rounded-lg
                    transition-all duration-200
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    }
                    ${isCollapsed ? 'justify-center' : ''}
                  `}
                  title={isCollapsed ? label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      className="font-medium whitespace-nowrap overflow-hidden"
                    >
                      {label}
                    </motion.span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-border">
          {!isCollapsed && (
            <p className="text-xs text-muted-foreground text-center">
              Communication Tools
            </p>
          )}
        </div>
      </motion.nav>
    </>
  );
};
