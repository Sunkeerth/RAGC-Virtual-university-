import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Play, ThumbsUp, Eye, Lock } from 'lucide-react';
import { IVideo } from '@shared/schema';

interface VideoCardProps {
  video: IVideo;
  onClick: (video: IVideo) => void;
  className?: string;
  restrictedAccess?: boolean;
}

export const VideoCard: React.FC<VideoCardProps> = ({ 
  video, 
  onClick, 
  className,
  restrictedAccess = false 
}) => {
  const handleClick = () => {
    onClick(video);
  };
  
  // Generate thumbnail URL from YouTube ID
  const thumbnailUrl = `https://img.youtube.com/vi/${video.youtubeId}/mqdefault.jpg`;
  
  return (
    <Card 
      className={cn(
        'cursor-pointer overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105',
        className
      )}
      onClick={handleClick}
    >
      <div className="relative">
        <img 
          src={thumbnailUrl} 
          alt={video.title} 
          className="w-full h-40 object-cover"
        />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/50">
          <div className="bg-primary rounded-full p-3">
            <Play className="h-5 w-5 text-white" />
          </div>
        </div>
        
        {/* Video duration (would be fetched from API in production) */}
        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 text-xs rounded">
          10:42
        </div>
        
        {/* Restricted access badge */}
        {restrictedAccess && (
          <div className="absolute top-2 right-2 bg-yellow-500/80 px-2 py-1 text-xs rounded flex items-center">
            <Lock className="h-3 w-3 mr-1" />
            Premium
          </div>
        )}
      </div>
      
      <CardContent className="p-3">
        <h3 className="font-medium mb-1 line-clamp-2">{video.title}</h3>
        <p className="text-muted-foreground text-sm mb-2 line-clamp-1">{video.description}</p>
        
        <div className="flex items-center text-xs text-muted-foreground">
          <ThumbsUp className="h-3 w-3 mr-1" />
          <span>{Math.floor(Math.random() * 500) + 50}</span>
          <span className="mx-2">•</span>
          <Eye className="h-3 w-3 mr-1" />
          <span>{video.views}</span>
        </div>
      </CardContent>
    </Card>
  );
};
