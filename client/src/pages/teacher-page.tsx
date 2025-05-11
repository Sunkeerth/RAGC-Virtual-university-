import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { VideoCard } from '@/components/video-card';
import { VideoPlayer } from '@/components/video-player';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { extractYouTubeId } from '@/lib/utils';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Loader2, Plus, Upload, X } from 'lucide-react';
import { IVideo, insertVideoSchema } from '@shared/schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

const videoSchema = insertVideoSchema.extend({
  youtubeUrl: z.string()
    .url('Please enter a valid URL')
    .refine(
      (url) => extractYouTubeId(url) !== null,
      'Please enter a valid YouTube URL'
    ),
});

type VideoFormValues = z.infer<typeof videoSchema>;

export default function TeacherPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<IVideo | null>(null);
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Fetch teacher's videos
  const { data: videos, isLoading } = useQuery<IVideo[]>({
    queryKey: ['/api/teacher/videos'],
  });
  
  // Fetch branches for dropdown
  const { data: branches } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['/api/branches'],
  });
  
  // Form setup
  const form = useForm<VideoFormValues>({
    resolver: zodResolver(videoSchema),
    defaultValues: {
      title: '',
      description: '',
      youtubeUrl: '',
      branchId: undefined,
      restrictedAccess: true,
      tags: [],
      teacherId: user?.id,
    },
  });
  
  // Upload video mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: VideoFormValues) => {
      // Extract YouTube ID from URL
      const youtubeId = extractYouTubeId(data.youtubeUrl);
      
      // Prepare data for API
      const videoData = {
        title: data.title,
        description: data.description,
        youtubeId: youtubeId!,
        branchId: Number(data.branchId),
        restrictedAccess: data.restrictedAccess,
        tags: tags,
        teacherId: user!.id,
      };
      
      const res = await apiRequest('POST', '/api/videos', videoData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Video Uploaded',
        description: 'Your video has been added successfully.',
      });
      
      // Close dialog and reset form
      setUploadDialogOpen(false);
      form.reset();
      setTags([]);
      
      // Refresh videos list
      queryClient.invalidateQueries({
        queryKey: ['/api/teacher/videos'],
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const handleVideoClick = (video: IVideo) => {
    setSelectedVideo(video);
    setVideoPlayerOpen(true);
  };
  
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim() !== '') {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };
  
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const onSubmit = (data: VideoFormValues) => {
    uploadMutation.mutate(data);
  };
  
  return (
    <div className="h-screen flex flex-col bg-background">
      <Header onToggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
          <Sidebar />
        </div>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-background pb-8">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">My Videos</h1>
              <Button 
                onClick={() => setUploadDialogOpen(true)}
                className="flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Video
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !videos || videos.length === 0 ? (
              <Card className="text-center p-8 flex flex-col items-center">
                <CardHeader>
                  <CardTitle>No Videos Yet</CardTitle>
                  <CardDescription>
                    Start sharing your knowledge by uploading your first video.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Upload className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Your uploaded videos will appear here. You can manage, track views and engagement.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => setUploadDialogOpen(true)}
                    className="flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Video
                  </Button>
                </CardFooter>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {videos.map((video) => (
                  <VideoCard 
                    key={video.id} 
                    video={video} 
                    onClick={handleVideoClick}
                    restrictedAccess={video.restrictedAccess}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Video upload dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Course Video</DialogTitle>
            <DialogDescription>
              Share your knowledge by adding a YouTube video to the platform.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="youtubeUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>YouTube Video URL</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://www.youtube.com/watch?v=..." 
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the URL of your YouTube video
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video Title</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Introduction to Data Structures" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of your video content..." 
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a branch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {branches?.map((branch: { id: number; name: string }) => (
                          <SelectItem key={branch.id} value={branch.id.toString()}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <FormLabel>Tags</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Add tag..."
                    className="w-32 h-8"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Press Enter to add a tag
                </p>
              </div>
              
              <FormField
                control={form.control}
                name="restrictedAccess"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4 border">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Restrict access to enrolled students only
                      </FormLabel>
                      <FormDescription>
                        Only students who have enrolled in this branch will be able to view this video
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button 
                  type="submit" 
                  disabled={uploadMutation.isPending}
                  className="ml-2"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Uploading...
                    </>
                  ) : (
                    'Add Video'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Video player modal */}
      <VideoPlayer
        video={selectedVideo}
        open={videoPlayerOpen}
        onClose={() => setVideoPlayerOpen(false)}
        teacherName={user?.name || 'Teacher'}
      />
    </div>
  );
}
