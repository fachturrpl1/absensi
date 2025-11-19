'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { AppSidebar } from './app-sidebar';
import { NavbarWithShortcuts } from './navbar-with-shortcuts';
// import CommandPalette from '../command-palette/command-palette';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pathname = usePathname();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  // Public pages - no layout
  const publicPages = ['/auth/login', '/auth/signup', '/onboarding'];
  const isPublicPage = publicPages.some(page => pathname === page) || pathname?.startsWith('/invite');
  
  if (isPublicPage) {
    return <>{children}</>;
  }

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // const sidebarWidth = sidebarCollapsed ? 80 : 280;
  // const mainLeftPadding = isMobile ? 0 : sidebarWidth;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AppSidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        isMobile={isMobile}
        onClose={() => setSidebarOpen(false)}
        onToggle={toggleSidebar}
      />

      {/* Main Content Area */}
      <div
        className={cn(
          'min-h-screen transition-all duration-300 ease-in-out',
          !isMobile && 'lg:ml-[280px]',
          !isMobile && sidebarCollapsed && 'lg:ml-[80px]'
        )}
      >
        {/* Navbar */}
        <NavbarWithShortcuts
          onMenuClick={toggleSidebar}
        />

        {/* Page Content with Animation */}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="p-4 md:p-6 lg:p-8"
        >
          {children}
        </motion.main>
      </div>

      {/* Command Palette */}
      {/* <CommandPalette /> */}
    </div>
  );
}
