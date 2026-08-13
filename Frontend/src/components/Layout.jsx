import React, { useState, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/utils';
import ThemeToggle from './ThemeToggle';
import LanguageSelector from './LanguageSelector';
import { displayCountryCode, useLanguage } from '../context/LanguageContext';

import {  
  Home,
  Send,
  LogOut,
  Menu,
  X,
  Search,
  Shield,
  UserPlus,
  FileText
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();

  const userCountryCode = displayCountryCode(user?.countryCode);
  const userCountryImage = userCountryCode ? `/flags/${userCountryCode.toLowerCase()}.svg` : null;

  const CountryFlag = ({ className = '' }) => userCountryImage && (
    <img
      src={userCountryImage}
      alt={`Bandera de ${userCountryCode}`}
      className={cn('inline-block h-4 w-6 rounded-sm object-cover shadow-sm', className)}
    />
  );


  // Memoize navigation to prevent recreation on every render
  const navigation = useMemo(() => (
    user?.role === 'admin'
      ? [
          { name: t.contracts, href: '/admin/contracts', icon: FileText },
          { name: t.accountManagement, href: '/admin/users', icon: Shield },
          { name: t.createAdmin, href: '/admin/create', icon: UserPlus },
        ]
      : [
          { name: t.statuses, href: '/', icon: Home },
          ...(user?.role === 'regular' ? [
            { name: t.sendContract, href: '/send_contracts', icon: Send },
          ] : []),
          { name: t.checkInformation, href: '/trazabilidad', icon: Search },
        ]
  ), [t.accountManagement, t.checkInformation, t.contracts, t.createAdmin, t.sendContract, t.statuses, user?.role]);
  const navigate = useNavigate();

  const NavButton = ({ href, icon: Icon, label, isActive, collapsed }) => (
    <button
      type="button"
      onClick={() => navigate(href)}
      className={cn(
        "group flex items-center flex-nowrap min-w-0 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 w-full text-left",
        isActive
          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm"
          : "text-foreground hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:text-foreground",
        collapsed && "justify-center px-2"
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "h-5 w-5 transition-colors duration-200",
            isActive
              ? "text-blue-600 dark:text-blue-400"
              : "text-foreground group-hover:text-foreground"
          )}
        />
      )}
      {!collapsed && <span className="ml-3 truncate">{label}</span>}
    </button>
  );
  
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={cn(
        "hidden lg:block fixed top-0 left-0 h-screen bg-card shadow-lg z-30 transition-all duration-300 border-r border-gray-200 dark:border-gray-700",
        sidebarCollapsed ? "w-20" : "w-72"
      )}>
        <div className={cn(
          "flex min-h-20 items-center border-b border-gray-200 dark:border-gray-700",
          sidebarCollapsed ? "justify-center gap-2 px-2 py-3" : "justify-between gap-3 px-4 py-3"
        )}>
          <div className={cn("flex items-center", !sidebarCollapsed && "min-w-0 flex-1")}>
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                {user?.firstName?.[0]}
              </div>
            )}
            {!sidebarCollapsed && (
              <div className="ml-3 min-w-0">
                <p className="text-sm font-semibold leading-5" style={{ color: 'var(--foreground)' }}>
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="mt-0.5 text-xs leading-4" style={{ color: 'var(--foreground)' }}>
                  {user?.role === 'admin' ? t.admin : user?.role === 'lawyer' ? t.lawyer : t.regularUser} {user?.countryCode ? `(${userCountryCode})` : ''}
                </p>
              </div>
            )}
          </div>
          <div className="flex shrink-0 items-center space-x-2">
            {/* Collapse/Expand Button */}
            <button
              className="p-1 rounded hover:bg-accent text-foreground"
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setSidebarCollapsed((c) => !c)}
            >
              {sidebarCollapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              )}
            </button>
          </div>
        </div>

        <nav className={cn("mt-5 px-2 space-y-1", sidebarCollapsed && "px-1")}>
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => { navigate(item.href); setSidebarOpen(false); }}
                    className={cn(
                      "group flex items-center flex-nowrap min-w-0 px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 w-full text-left",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-foreground hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:text-foreground",
                      sidebarCollapsed && "justify-center px-2"
                    )}
                  >
                    <item.icon
                      className={cn(
                        // Center icon when collapsed, otherwise add right margin
                        sidebarCollapsed ? "h-5 w-5" : "mr-3 h-5 w-5",
                        "transition-colors duration-200",
                        isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-foreground group-hover:text-foreground"
                      )}
                    />
                    {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
                  </button>
                );
              })}
        </nav>

        {!sidebarCollapsed && (
          <div className="px-2 mt-4">
            <LanguageSelector sidebar />
          </div>
        )}

        <div className={cn("absolute bottom-0 w-full border-t border-gray-200 dark:border-gray-700", sidebarCollapsed ? "p-2" : "p-4")}> 
          <button
            onClick={logout}
            className={cn(
              "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-foreground hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:text-foreground",
              sidebarCollapsed && "justify-center px-2"
            )}
          >
            <LogOut className={cn("h-5 w-5 transition-colors duration-200", sidebarCollapsed ? "" : "mr-3", "text-foreground group-hover:text-foreground")}/>
            {!sidebarCollapsed && t.signOut}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className={cn("flex flex-col flex-1 transition-all duration-300 min-h-screen bg-background", sidebarCollapsed ? "lg:ml-20" : "lg:ml-72")}>
        {/* Top navigation */}
        <div className="flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-card px-4 shadow-sm">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-foreground lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="hidden sm:flex items-center gap-2 text-sm font-semibold text-foreground ml-2">
            <span>{t.appName}</span>
            {user?.countryCode && (
              <span className="inline-flex items-center rounded-full border border-gray-300 dark:border-gray-600 px-2 py-0.5 text-xs">
                <CountryFlag className="mr-1" /> {userCountryCode}
              </span>
            )}
          </div>
          {/* Language selector moved into the sidebar to appear across screens */}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
        

      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black bg-opacity-25"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Sidebar */}
          <div className="relative flex w-64 flex-col bg-card shadow-lg border-r border-gray-200 dark:border-gray-700">
            <button
              className="absolute top-4 right-4 text-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6" />
            </button>
            <div className="flex h-16 items-center px-4 border-b border-gray-200 dark:border-gray-700">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="h-8 w-8 rounded-full object-cover" />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                  {user?.firstName?.[0]}
                </div>
              )}
              <div className="ml-3">
                <p className="text-sm font-medium text-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-foreground">
                  {user?.role === 'admin' ? t.admin : user?.role === 'lawyer' ? t.lawyer : t.regularUser} {user?.countryCode ? `(${userCountryCode})` : ''}
                </p>
              </div>
              <div className="ml-auto pr-4">
              </div>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm"
                        : "text-foreground hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:text-foreground"
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={cn(
                        "mr-3 h-5 w-5 transition-colors duration-200",
                        isActive
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-foreground group-hover:text-foreground"
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <LanguageSelector sidebar />
            </div>
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <LanguageSelector sidebar />
            </div>
            <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  logout();
                  setSidebarOpen(false);
                }}
                className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-foreground rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:text-foreground transition-all duration-200"
              >
                <LogOut className="mr-3 h-5 w-5 text-foreground transition-colors duration-200" />
                {t.signOut}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
