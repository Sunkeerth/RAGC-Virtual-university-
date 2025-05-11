import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, useParams } from 'wouter';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { BranchDetails } from '@/components/branch-details';
import { VideoCard } from '@/components/video-card';
import { VideoPlayer } from '@/components/video-player';
import { Loader2 } from 'lucide-react';
import { IBranch as Branch, IEquipmentKit as EquipmentKit, ISpecialization as Specialization, IVideo as Video } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface BranchData {
  branch: Branch;
  equipmentKits: EquipmentKit[];
  specializations: Specialization[];
}

export default function BranchPage() {
  const { id } = useParams();
  const branchId = parseInt(id || '0');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  
  // Fetch branch data
  const { data: branchData, isLoading: branchLoading } = useQuery<BranchData>({
    queryKey: ['branch', branchId],
    queryFn: async () => {
      const res = await fetch(`/api/branches/${branchId}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch branch data');
      return res.json();
    },
    enabled: !!branchId && !isNaN(branchId)
  });
  
  // Fetch branch videos
  const { data: videos, isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ['branch-videos', branchId],
    queryFn: async () => {
      const res = await fetch(`/api/branches/${branchId}/videos`, {
        credentials: 'include'
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!branchId && !isNaN(branchId)
  });
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setVideoPlayerOpen(true);
  };
  
  const handleCloseVideoPlayer = () => {
    setVideoPlayerOpen(false);
  };
  
  const isLoading = branchLoading || videosLoading;
  
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
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : branchData ? (
            <div className="p-4">
              <h1 className="text-2xl font-bold mb-6">{branchData.branch.name}</h1>
              
              <Tabs defaultValue="overview">
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="videos">Videos</TabsTrigger>
                  <TabsTrigger value="resources">Resources</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview">
                  <BranchDetails 
                    branch={branchData.branch}
                    equipmentKits={branchData.equipmentKits}
                    specializations={branchData.specializations}
                  />
                </TabsContent>
                
                <TabsContent value="videos">
                  {videosLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : videos && videos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {videos.map((video) => (
                        <VideoCard 
                          key={video.id} 
                          video={video} 
                          onClick={handleVideoClick}
                          restrictedAccess={video.restrictedAccess ?? undefined}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No videos available for this branch yet.</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="resources">
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Resources will be available soon.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center py-12 text-destructive">
              <p>Branch not found. Please select a valid branch.</p>
            </div>
          )}
        </main>
      </div>
      
      {/* Video player modal */}
      <VideoPlayer
        video={selectedVideo}
        open={videoPlayerOpen}
        onClose={handleCloseVideoPlayer}
        teacherName="Professor"
      />
    </div>
  );
}