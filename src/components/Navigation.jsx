import { Link, useLocation } from 'react-router-dom';
import { Heart, Target, Users, Lightbulb, Laptop as NotebookPen, Trophy, BarChart3, Sparkles, Bot, MessageSquare, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '@/context/SidebarContext';

export const Navigation = () => {
  const location = useLocation();
  const { isCollapsed, toggleCollapse, isMobileOpen, toggleMobile, closeMobile } = useSidebar();
  
  const navItems = [
    { path: '/', label: 'Builder', icon: Sparkles },
    { path: '/emotions', label: 'Emotions', icon: Heart },
    { path: '/ai-roleplay', label: 'AI Practice', icon: Bot },
    { path: '/couples', label: 'Couples', icon: MessageSquare },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/exercises', label: 'Exercises', icon: Lightbulb },
    { path: '/journal', label: 'Journal', icon: NotebookPen },
    { path: '/history', label: 'History', icon: Trophy },
  ];

  const sidebarWidth = isCollapsed ? 72 : 240;

  return (
    <>
      <button
        onClick={toggleMobile}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-lg shadow-lg border border-border"
      >
        {isMobileOpen ? (
          <X className="w-6 h-6 text-foreground" />
        ) : (
          <Menu className="w-6 h-6 text-foreground" />
        )}
      </button>

      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      <motion.nav
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ duration: 0.2 }}
        className={`
          fixed left-0 top-0 h-full z-50 md:z-30
          bg-card border-r border-border shadow-lg
          flex flex-col
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          transition-transform duration-200
        `}
      >
        <div className="p-4 border-b border-border flex items-center justify-between min-h-[64px]">
          <AnimatePresence mode="wait">
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
          </AnimatePresence>
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-lg hover:bg-accent transition-colors hidden md:flex items-center justify-center"
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
                  onClick={closeMobile}
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
                  <AnimatePresence mode="wait">
                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="font-medium whitespace-nowrap overflow-hidden"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="p-4 border-t border-border min-h-[56px]">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-muted-foreground text-center"
              >
                Communication Tools
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>
    </>
  );
};
