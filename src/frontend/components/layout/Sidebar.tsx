import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTodoStore } from '../../store/todoStore';
import { SPRING_DEFAULT, FADE_NORMAL } from '../../config/animations';

export interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  email: string | null;
}

const NAV_LINKS = [
  { label: 'Dashboard', to: '/dashboard', statusFilter: null              },
  { label: 'All Todos', to: '/todos',     statusFilter: 'all' as const   },
  { label: 'Pending',   to: '/todos',     statusFilter: 'pending' as const },
  { label: 'Completed', to: '/todos',     statusFilter: 'completed' as const },
] as const;

type NavLink = (typeof NAV_LINKS)[number];

function isLinkActive(link: NavLink, pathname: string, status: string): boolean {
  if (link.statusFilter === null) return pathname === '/dashboard';
  return pathname === '/todos' && status === link.statusFilter;
}

interface SidebarContentProps {
  layoutId: string;
  onClose: () => void;
  onLogout: () => void;
  email: string | null;
}

function SidebarContent({ layoutId, onClose, onLogout, email }: SidebarContentProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const filters = useTodoStore((state) => state.filters);
  const setFilters = useTodoStore((state) => state.setFilters);

  const handleLinkClick = (link: NavLink) => {
    if (link.statusFilter !== null) {
      setFilters({ status: link.statusFilter });
      navigate('/todos');
    } else {
      navigate('/dashboard');
    }
    onClose();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Branding */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-gray-200">
        <svg
          className="w-6 h-6 text-blue-600 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <span className="font-bold text-gray-900">Todo App</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_LINKS.map((link) => {
          const active = isLinkActive(link, pathname, filters.status);
          return (
            <div key={link.label} className="relative">
              {active && (
                <motion.div
                  layoutId={layoutId}
                  className="absolute inset-0 bg-blue-50 rounded-lg"
                  transition={SPRING_DEFAULT}
                />
              )}
              <button
                onClick={() => handleLinkClick(link)}
                className={`relative z-10 w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'text-blue-700' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {link.label}
              </button>
            </div>
          );
        })}
      </nav>

      {/* Bottom: user email + logout (AC-D08.6) */}
      <div className="px-4 py-4 border-t border-gray-200">
        {email && (
          <p className="text-xs text-gray-500 truncate mb-3">{email}</p>
        )}
        <button
          onClick={onLogout}
          className="text-sm text-gray-600 hover:text-gray-900 font-medium"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ isOpen, onClose, onLogout, email }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — AC-D12.3 */}
      <aside className="hidden md:flex flex-col w-60 fixed inset-y-0 left-0 bg-white border-r border-gray-200 z-30">
        <SidebarContent
          layoutId="sidebar-active-desktop"
          onClose={onClose}
          onLogout={onLogout}
          email={email}
        />
      </aside>

      {/* Mobile overlay — AC-D08.7/D08.8, AC-D12.1 */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={FADE_NORMAL}
              className="fixed inset-0 bg-black z-40 md:hidden"
              onClick={onClose}
              aria-hidden="true"
            />
            {/* Drawer */}
            <motion.aside
              key="sidebar-drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={SPRING_DEFAULT}
              className="fixed inset-y-0 left-0 w-60 bg-white border-r border-gray-200 z-50 md:hidden flex flex-col"
            >
              <SidebarContent
                layoutId="sidebar-active-mobile"
                onClose={onClose}
                onLogout={onLogout}
                email={email}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
