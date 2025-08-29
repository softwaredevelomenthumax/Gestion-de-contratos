import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import ThemeToggle from './ThemeToggle';

import {  
  Home,
  FileText,
  Send,
  Users,
  LogOut,
  Menu,
  X,
  Search,
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Estados', href: '/', icon: Home },

    ...(user?.role === 'regular' ? [
      { name: 'Enviar Contrato', href: '/send_contracts', icon: Send },
    ] : []),
    { name: 'Consultar Información', href: '/trazabilidad', icon: Search },
  ];
  
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className={cn(
        "hidden lg:block fixed top-0 left-0 h-screen bg-card shadow-lg z-30 transition-all duration-300 border-r border-gray-200 dark:border-gray-700",
        sidebarCollapsed ? "w-20" : "w-64"
      )}>
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
              {user?.firstName?.[0]}
            </div>
            {!sidebarCollapsed && (
              <div className="ml-3">
                <p 
                  className="text-sm font-medium" 
                  style={{ color: 'var(--foreground)' }}
                >
                  {user?.firstName} {user?.lastName}
                </p>
                <p 
                  className="text-xs" 
                  style={{ color: 'var(--foreground)' }}
                >
                  {user?.role === 'lawyer' ? 'Abogado' : 'Usuario'}
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Theme Toggle Button - Solo mostrar cuando no esté colapsado */}
            {!sidebarCollapsed && <ThemeToggle />}
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
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm"
                    : "text-foreground hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:text-foreground",
                  sidebarCollapsed && "justify-center px-2"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-colors duration-200",
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-foreground group-hover:text-foreground"
                  )}
                />
                {!sidebarCollapsed && <span className="ml-3">{item.name}</span>}
              </Link>
            );
          })}
          
          {/* Theme Toggle Button cuando el sidebar está colapsado */}
          {sidebarCollapsed && (
            <div className="flex justify-center pt-2">
              <ThemeToggle />
            </div>
          )}
        </nav>

        <div className={cn("absolute bottom-0 w-full border-t border-gray-200 dark:border-gray-700", sidebarCollapsed ? "p-2" : "p-4")}> 
          <button
            onClick={logout}
            className={cn(
              "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-foreground hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:text-foreground",
              sidebarCollapsed && "justify-center px-2"
            )}
          >
            <LogOut className={cn("h-5 w-5 transition-colors duration-200", sidebarCollapsed ? "" : "mr-3", "text-foreground group-hover:text-foreground")}/>
            {!sidebarCollapsed && "Cerrar sesión"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className={cn("flex flex-col flex-1 transition-all duration-300 min-h-screen bg-background", sidebarCollapsed ? "lg:ml-20" : "lg:ml-64")}>
        {/* Top navigation */}
        <div className="flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-700 bg-card px-4 shadow-sm">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-foreground lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
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
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                {user?.firstName?.[0]}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-foreground">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-foreground">
                  {user?.role === 'lawyer' ? 'Abogado' : 'Usuario'}
                </p>
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
            <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  logout();
                  setSidebarOpen(false);
                }}
                className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-foreground rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/80 hover:text-foreground transition-all duration-200"
              >
                <LogOut className="mr-3 h-5 w-5 text-foreground transition-colors duration-200" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;

//sin digito de verficacion

//Nit en (alfanumerico)

//polizas en finalizado