import React from 'react';
import { cn } from '@/lib/utils';
import { PlayCircle } from 'lucide-react';
import { Link } from 'wouter';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Logo: React.FC<LogoProps> = ({ className, size = 'md' }) => {
  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };
  
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };
  
  return (
    <Link href="/">
      <a className={cn('flex items-center', className)}>
        <PlayCircle className={cn('text-primary mr-1', iconSizes[size])} />
        <span className={cn('font-bold', textSizes[size])}>EduTube</span>
      </a>
    </Link>
  );
};
