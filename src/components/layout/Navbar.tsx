
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Calendar, Layout } from 'lucide-react';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import LogoAnimation from '@/components/ui/LogoAnimation';
import NavLink from '@/components/layout/NavLink';
import NotificationsPopover from '@/components/notifications/NotificationsPopover';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Find Salons', path: '/book-now' },
  { label: 'Hair Recommendation', path: '/hair-recommendation' },
  { label: 'My Bookings', path: '/my-bookings' },
  { label: 'For Merchants', path: '/merchant-login' },
];

export const ProfileDropdown = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const navigate = useNavigate();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center rounded-full border border-border p-1 text-sm font-medium hover:bg-accent/50">
          <Avatar className="h-8 w-8">
            <AvatarImage 
              src={user.avatar_url || ''}
              alt={user.email || 'User'} 
            />
            <AvatarFallback>
              {(user.email?.charAt(0) || 'U').toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.email || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.role || 'Customer'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/my-bookings')}>
          <Calendar className="mr-2 h-4 w-4" />
          <span>My Bookings</span>
        </DropdownMenuItem>
        {user.is_merchant && (
          <DropdownMenuItem onClick={() => navigate('/merchant-dashboard')}>
            <Layout className="mr-2 h-4 w-4" />
            <span>Merchant Dashboard</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await signOut();
      // Clearing localStorage items related to auth
      window.localStorage.removeItem('supabase.auth.token');
      navigate('/auth', { replace: true });
      
      toast({
        title: "Sign out successful",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing you out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMerchantClick = () => {
    navigate('/merchant-login');
  };

  return (
    <header className="fixed w-full top-0 bg-background/80 backdrop-blur-md z-50 border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <LogoAnimation size="sm" />
            </Link>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.filter(link => link.label !== 'For Merchants').map((link) => (
              <NavLink key={link.path} to={link.path} className="nav-link">
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <NotificationsPopover />
                <ProfileDropdown user={user} onLogout={handleLogout} />
              </>
            ) : (
              <>
                <Button variant="default" size="sm" onClick={() => navigate('/auth')}>
                  Sign In
                </Button>
                <div className="hidden md:block">
                  <Button variant="outline" size="sm" onClick={handleMerchantClick}>
                    For Merchants
                  </Button>
                </div>
              </>
            )}
            <ThemeToggle />
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
      <div className={`md:hidden fixed left-0 top-16 w-full bg-background border-b border-border z-50 transition-all duration-300 ${mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        <nav className="flex flex-col p-4 space-y-2">
          {navLinks.filter(link => link.label !== 'For Merchants').map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className="block py-2 px-4 rounded-md hover:bg-accent hover:text-accent-foreground"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full justify-start" 
            onClick={() => {
              navigate('/merchant-login');
              setMobileMenuOpen(false);
            }}
          >
            For Merchants
          </Button>
          {user ? (
            <>
              <Link
                to="/profile"
                className="block py-2 px-4 rounded-md hover:bg-accent hover:text-accent-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Profile
              </Link>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="default" size="sm" className="w-full" onClick={() => {
                navigate('/auth');
                setMobileMenuOpen(false);
              }}>
                Sign In
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
