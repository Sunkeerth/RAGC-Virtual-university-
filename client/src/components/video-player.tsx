import React from 'react';
import { cn } from '@/lib/utils';
import { getYouTubeEmbedUrl } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, Share, ListPlus } from 'lucide-react';
import { Video } from '@shared/schema';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';

interface VideoPlayerProps {
  video: Video | null;
  open: boolean;
  onClose: () => void;
  teacherName?: string;
  className?: string;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  video, 
  open, 
  onClose,
  teacherName = 'Instructor',
  className 
}) => {
  if (!video) return null;
  
  const getTeacherInitials = () => {
    const parts = teacherName.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`;
    }
    return teacherName.substring(0, 2).toUpperCase();
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        <DialogClose className="absolute right-2 top-2 z-10" />
        
        <div className="bg-black">
          <div className="aspect-video w-full">
            <iframe
              src={getYouTubeEmbedUrl(video.youtubeId)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={video.title}
            />
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="text-xl font-bold mb-1">{video.title}</h3>
          <div className="flex items-center text-muted-foreground text-sm mb-4 flex-wrap">
            <span>{teacherName}</span>
            <span className="mx-2">•</span>
            <span>Branch: {video.branchId}</span>
            <span className="mx-2">•</span>
            <span>{video.views} views</span>
          </div>
          
          <div className="flex space-x-4 mb-4 flex-wrap gap-y-2">
            <Button variant="ghost" size="sm" className="flex items-center">
              <ThumbsUp className="mr-1 h-4 w-4" />
              <span>Like</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center">
              <ThumbsDown className="mr-1 h-4 w-4" />
              <span>Dislike</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center">
              <ListPlus className="mr-1 h-4 w-4" />
              <span>Save</span>
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center">
              <Share className="mr-1 h-4 w-4" />
              <span>Share</span>
            </Button>
          </div>
          
          <div className="border-t border-border pt-4">
            <div className="flex items-start">
              <Avatar className="h-10 w-10 mr-3">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getTeacherInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{teacherName}</p>
                <p className="text-muted-foreground text-sm mb-2">Instructor • {Math.floor(Math.random() * 100) + 1} videos</p>
                <p className="text-muted-foreground text-sm">{video.description}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
