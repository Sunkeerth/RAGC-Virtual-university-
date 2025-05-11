import React from 'react';
import { cn } from '@/lib/utils';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import {
  Home,
  BookOpen,
  PlayCircle,
  History,
  Computer,
  Zap,
  Cpu,
  FlaskRound,
  Building,
  BrainCircuit,
  Wifi,
  Headset,
  Settings,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ className, collapsed = false }) => {
  const [location] = useLocation();
  const { user } = useAuth();

  const isTeacher = user?.role === 'teacher';

  const NavItem = ({
    href,
    icon: Icon,
    label
  }: {
    href: string;
    icon: React.ElementType;
    label: string;
  }) => {
    const isActive = location === href;

    return (
      <Link
        href={href}
        className={cn(
          'flex items-center p-2 rounded hover:bg-muted transition-colors gap-x-3',
          isActive && 'bg-muted font-medium',
          collapsed && 'justify-center'
        )}
      >
        <Icon className="h-5 w-5" />
        {!collapsed && <span>{label}</span>}
      </Link>
    );
  };

  const branches = [
    { id: 1, label: 'Computer Science', icon: Computer },
    { id: 2, label: 'Electrical Engineering', icon: Zap },
    { id: 3, label: 'Mechanical Engineering', icon: Cpu },
    { id: 4, label: 'Chemical Engineering', icon: FlaskRound },
    { id: 5, label: 'Civil Engineering', icon: Building },
    { id: 6, label: 'AI & Machine Learning', icon: BrainCircuit },
    { id: 7, label: 'Internet of Things', icon: Wifi },
    { id: 8, label: 'VR & AR Technology', icon: Headset }
  ];

  return (
    <aside
      className={cn(
        'bg-background border-r border-border h-full flex flex-col',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      <nav className="p-3 flex-1 overflow-y-auto">
        <div className="space-y-1 mb-6">
          <NavItem href="/" icon={Home} label="Home" />
          <NavItem href="/profile" icon={BookOpen} label="My Courses" />
          {isTeacher ? (
            <NavItem href="/teacher" icon={PlayCircle} label="My Videos" />
          ) : (
            <NavItem href="/vr-lab" icon={Headset} label="VR Lab" />
          )}
          <NavItem href="/history" icon={History} label="History" />
        </div>

        {!collapsed && (
          <div className="text-xs text-muted-foreground mb-2 px-2 font-medium uppercase">
            Branches
          </div>
        )}

        <div className="space-y-1 mb-6">
          {branches.map((branch) => (
            <NavItem
              key={branch.id}
              href={`/branch/${branch.id}`}
              icon={branch.icon}
              label={branch.label}
            />
          ))}
        </div>

        {!collapsed && (
          <div className="text-xs text-muted-foreground mb-2 px-2 font-medium uppercase">
            Settings
          </div>
        )}

        <div className="space-y-1">
          <NavItem href="/settings" icon={Settings} label="Settings" />
          <NavItem href="/help" icon={HelpCircle} label="Help" />
          <NavItem href="/feedback" icon={MessageSquare} label="Send Feedback" />
        </div>

        {!collapsed && (
          <div className="text-xs text-muted-foreground mt-6 px-2">
            <p>© 2023 EduTube LMS</p>
            <p className="mt-1">Terms · Privacy · Policy & Safety</p>
          </div>
        )}
      </nav>
    </aside>
  );
};
