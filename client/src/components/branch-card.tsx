import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Users, GraduationCap } from 'lucide-react';
import { useLocation } from 'wouter';
import { IBranch } from '@shared/schema';

interface BranchCardProps {
  branch: IBranch;
  className?: string;
}

export const BranchCard: React.FC<BranchCardProps> = ({ branch, className }) => {
  const [, navigate] = useLocation();
  
  return (
    <Card 
      className={cn(
        'cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105',
        className
      )}
      onClick={() => navigate(`/branch/${branch.id}`)}
    >
      <div className="relative">
        <img 
          src={branch.image} 
          alt={branch.name} 
          className="w-full h-40 object-cover"
        />
        <div className="absolute bottom-2 right-2 bg-background/80 px-2 py-1 text-xs rounded flex items-center">
          <MapPin className="h-3 w-3 mr-1" />
          {branch.location}
        </div>
      </div>
      
      <CardContent className="p-3">
        <h3 className="font-medium mb-1">{branch.name}</h3>
        <p className="text-muted-foreground text-sm mb-2">{branch.description}</p>
        
        <div className="flex items-center text-xs text-muted-foreground">
          <Users className="h-3 w-3 mr-1" />
          <span>{branch.studentsCount} Students</span>
          <span className="mx-2">•</span>
          <GraduationCap className="h-3 w-3 mr-1" />
          <span>{branch.teachersCount} Teachers</span>
        </div>
      </CardContent>
    </Card>
  );
};
