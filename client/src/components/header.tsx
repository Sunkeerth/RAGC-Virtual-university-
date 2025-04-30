import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Logo } from './logo';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { 
  Menu, 
  Search, 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  BookOpen, 
  HelpCircle, 
  ChevronDown 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface HeaderProps {
  onToggleSidebar?: () => void;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, className }) => {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const getUserInitials = () => {
    if (!user || !user.name) return 'U';
    
    const nameParts = user.name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[1][0]}`;
    }
    
    return nameParts[0][0];
  };
  
  return (
    <header className={cn(
      'bg-background border-b border-border py-2 px-4 flex items-center justify-between sticky top-0 z-50',
      className
    )}>
      {/* Left section - Logo and menu */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="mr-4 lg:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <Logo />
      </div>
      
      {/* Center section - Search bar (desktop) */}
      <div className="hidden md:flex items-center flex-1 max-w-2xl mx-6">
        <div className="flex w-full">
          <Input
            type="text"
            placeholder="Search courses, branches, or videos"
            className="py-2 rounded-l-full border-r-0"
          />
          <Button
            variant="outline"
            className="rounded-l-none rounded-r-full"
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Right section - Account and settings */}
      <div className="flex items-center">
        {/* Mobile search button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setSearchOpen(!searchOpen)}
        >
          <Search className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="ml-2"
        >
          <Bell className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="ml-4 p-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                {user?.studentId && (
                  <p className="text-xs font-medium">ID: {user.studentId}</p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <BookOpen className="mr-2 h-4 w-4" />
              <span>My Courses</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="text-red-500 focus:text-red-500" 
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{logoutMutation.isPending ? 'Logging out...' : 'Sign out'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Mobile search bar (shown when searchOpen is true) */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 p-2 bg-background border-b border-border md:hidden">
          <div className="flex w-full">
            <Input
              type="text"
              placeholder="Search courses, branches, or videos"
              className="py-2 rounded-l-md border-r-0"
            />
            <Button
              variant="outline"
              className="rounded-l-none rounded-r-md"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
