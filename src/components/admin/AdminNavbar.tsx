
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, LogOut, Menu, X, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import ThemeToggle from '@/components/ui/theme-toggle';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AdminNavbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    supabase.auth.signOut();
    // Clear admin session
    sessionStorage.removeItem('isAdminLoggedIn');
    sessionStorage.removeItem('adminEmail');
    
    toast({
      title: "Logged Out",
      description: "You have been logged out of the admin portal.",
    });
    
    // Redirect to admin login
    window.location.href = '/admin-login';
  };

  const adminNavLinks = [
    { label: 'Dashboard', path: '/admin-dashboard' },
    { label: 'Return to Site', path: '/' },
  ];

  return (
    <header className="fixed w-full top-0 bg-red-50 dark:bg-red-950/20 backdrop-blur-md z-50 border-b border-red-200 dark:border-red-900/50">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/admin-dashboard" className="flex items-center">
              <ShieldAlert className="h-6 w-6 text-red-500 mr-2" />
              <span className="font-bold text-lg bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">
                Admin Portal
              </span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {adminNavLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-2">
            <ThemeToggle />
            
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700"
            >
              <LogOut className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
            
            <button 
              className="md:hidden" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <motion.div 
        className={`md:hidden fixed left-0 top-16 w-full bg-red-50 dark:bg-red-950/20 border-b border-red-200 dark:border-red-900/50 z-50 ${mobileMenuOpen ? 'block' : 'hidden'}`}
        initial={false}
        animate={mobileMenuOpen ? { opacity: 1, height: 'auto' } : { opacity: 0, height: 0 }}
      >
        <nav className="flex flex-col p-4 space-y-2">
          {adminNavLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="block py-2 px-4 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Button 
            variant="destructive" 
            className="w-full justify-start bg-red-600 hover:bg-red-700 mt-2" 
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </nav>
      </motion.div>
    </header>
  );
};

export default AdminNavbar;
