import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { useToast } from '@/hooks/use-toast';
import { VideoCard } from '@/components/video-card';
import { VideoPlayer } from '@/components/video-player';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Calendar, GraduationCap, Timer, CheckCircle, Info } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Branch, Video, VrSession, Payment } from '@shared/schema';
import { useLocation } from 'wouter';

export default function StudentProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
  
  // Fetch enrolled branches (convert IDs to actual branch data)
  const { data: allBranches, isLoading: branchesLoading } = useQuery<Branch[]>({
    queryKey: ['/api/branches'],
  });
  
  // Fetch user's VR sessions
  const { data: vrSessions, isLoading: sessionsLoading } = useQuery<VrSession[]>({
    queryKey: ['/api/vr-sessions'],
  });
  
  // Fetch user's payment history
  const { data: payments, isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ['/api/user/payments'],
    queryFn: async () => {
      try {
        const res = await fetch('/api/user/payments', {
          credentials: 'include',
        });
        
        if (res.ok) {
          return await res.json();
        }
        
        // For demo purposes, if endpoint doesn't exist, return empty array
        return [];
      } catch (error) {
        console.error('Error fetching payments:', error);
        return [];
      }
    },
  });
  
  // Fetch videos from enrolled branches
  const { data: videos, isLoading: videosLoading } = useQuery<Video[]>({
    queryKey: ['/api/user/videos'],
    queryFn: async () => {
      try {
        // Try to fetch videos from enrolled branches
        if (user?.enrolledBranches && user.enrolledBranches.length > 0) {
          const branchId = user.enrolledBranches[0];
          const res = await fetch(`/api/branches/${branchId}/videos`, {
            credentials: 'include',
          });
          
          if (res.ok) {
            return await res.json();
          }
        }
        
        // For demo purposes, if no enrolled branches or fetch fails, return empty array
        return [];
      } catch (error) {
        console.error('Error fetching videos:', error);
        return [];
      }
    },
    enabled: !!user?.enrolledBranches && user.enrolledBranches.length > 0,
  });
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setVideoPlayerOpen(true);
  };
  
  // Get user's enrolled branches
  const enrolledBranches = user?.enrolledBranches && allBranches 
    ? allBranches.filter(branch => user.enrolledBranches.includes(branch.id))
    : [];
  
  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Get name initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`;
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const isLoading = branchesLoading || sessionsLoading || paymentsLoading || videosLoading;
  
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
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center">
                <Avatar className="h-16 w-16 mr-4">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {user?.name ? getInitials(user.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">{user?.name}</h1>
                  <p className="text-muted-foreground">
                    {user?.studentId ? (
                      <span className="flex items-center">
                        <GraduationCap className="h-4 w-4 mr-1" />
                        Student ID: {user.studentId}
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <Info className="h-4 w-4 mr-1" />
                        No courses enrolled yet
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => navigate('/settings')}>
                  Edit Profile
                </Button>
                {user?.enrolledBranches?.length === 0 && (
                  <Button onClick={() => navigate('/')}>
                    Explore Courses
                  </Button>
                )}
              </div>
            </div>
            
            <Tabs defaultValue="courses">
              <TabsList className="mb-6">
                <TabsTrigger value="courses">My Courses</TabsTrigger>
                <TabsTrigger value="videos">Learning Videos</TabsTrigger>
                <TabsTrigger value="vr">VR Lab Sessions</TabsTrigger>
                <TabsTrigger value="payments">Payment History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="courses">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : enrolledBranches.length === 0 ? (
                  <Card className="text-center p-8">
                    <CardHeader>
                      <CardTitle>No Courses Enrolled</CardTitle>
                      <CardDescription>
                        Enroll in courses to start your learning journey
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground mb-6">
                        Explore our wide range of courses and specializations to kickstart your career.
                      </p>
                      <Button onClick={() => navigate('/')}>
                        Browse Courses
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {enrolledBranches.map((branch) => (
                      <Card key={branch.id} className="overflow-hidden">
                        <div className="sm:flex">
                          <div className="sm:w-1/3 md:w-1/4 h-48 sm:h-auto">
                            <img 
                              src={branch.image} 
                              alt={branch.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-6 sm:w-2/3 md:w-3/4">
                            <h2 className="text-xl font-bold mb-2">{branch.name}</h2>
                            <div className="flex items-center text-sm text-muted-foreground mb-4">
                              <Calendar className="h-4 w-4 mr-1" />
                              <span>Enrolled: {formatDate(new Date().toISOString())}</span> {/* Demo date */}
                              <span className="mx-2">•</span>
                              <GraduationCap className="h-4 w-4 mr-1" />
                              <span>{branch.teachersCount} Teachers</span>
                            </div>
                            
                            <p className="text-muted-foreground mb-4">{branch.description}</p>
                            
                            <div className="mb-4">
                              <div className="flex justify-between text-sm mb-1">
                                <span>Course Progress</span>
                                <span>25%</span> {/* Demo progress */}
                              </div>
                              <Progress value={25} className="h-2" />
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mt-4">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/branch/${branch.id}`)}
                              >
                                View Course
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate('/vr-lab')}
                              >
                                VR Lab
                              </Button>
                              <Badge variant="outline" className="flex items-center">
                                <span className="bg-primary/20 rounded-full h-2 w-2 mr-1"></span>
                                In Progress
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="videos">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !videos || videos.length === 0 ? (
                  <Card className="text-center p-8">
                    <CardHeader>
                      <CardTitle>No Videos Available</CardTitle>
                      <CardDescription>
                        Videos will appear here when you enroll in courses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-6">
                        Enroll in a course to access instructional videos and learning materials.
                      </p>
                      <Button onClick={() => navigate('/')}>
                        Browse Courses
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {videos.map((video) => (
                      <VideoCard
                        key={video.id}
                        video={video}
                        onClick={handleVideoClick}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="vr">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !vrSessions || vrSessions.length === 0 ? (
                  <Card className="text-center p-8">
                    <CardHeader>
                      <CardTitle>No VR Lab Sessions</CardTitle>
                      <CardDescription>
                        Start a VR lab session to see your progress here
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-6">
                        Experience hands-on learning with our virtual reality lab environments.
                      </p>
                      <Button onClick={() => navigate('/vr-lab')}>
                        Launch VR Lab
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {vrSessions.map((session) => (
                      <Card key={session.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <h3 className="font-medium">Equipment #{session.equipmentId}</h3>
                              {session.completed && (
                                <Badge className="ml-2 bg-green-500/10 text-green-500 hover:bg-green-500/20">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(session.startTime)}
                            </div>
                          </div>
                          
                          <div className="mb-2">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{session.progress}%</span>
                            </div>
                            <Progress value={session.progress} className="h-2" />
                          </div>
                          
                          <div className="flex justify-between items-center mt-2">
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Timer className="h-4 w-4 mr-1" />
                              <span>
                                {session.endTime ? 
                                  `Duration: ${Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 60000)} min` : 
                                  'Session in progress'}
                              </span>
                            </div>
                            
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate('/vr-lab')}
                            >
                              {session.completed ? 'Review Session' : 'Continue Session'}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="payments">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !payments || payments.length === 0 ? (
                  <Card className="text-center p-8">
                    <CardHeader>
                      <CardTitle>No Payment History</CardTitle>
                      <CardDescription>
                        Your payment records will appear here after enrollment
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Enroll in a course to view your payment history and upcoming installments.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment History</CardTitle>
                      <CardDescription>
                        View your payment records and upcoming installments
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="border rounded-md">
                        <div className="grid grid-cols-5 gap-4 p-3 font-medium border-b text-sm">
                          <div>Branch</div>
                          <div>Date</div>
                          <div>Amount</div>
                          <div>Installment</div>
                          <div>Status</div>
                        </div>
                        
                        <div className="divide-y">
                          {payments.map((payment) => {
                            // Find branch name
                            const branch = allBranches?.find(b => b.id === payment.branchId);
                            
                            return (
                              <div key={payment.id} className="grid grid-cols-5 gap-4 p-3 text-sm">
                                <div>{branch?.name || `Branch #${payment.branchId}`}</div>
                                <div>{formatDate(payment.createdAt)}</div>
                                <div>{formatCurrency(payment.amount)}</div>
                                <div>Installment {payment.installmentNumber}/3</div>
                                <div>
                                  <Badge className={
                                    payment.status === 'completed' ? 
                                    'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 
                                    'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                                  }>
                                    {payment.status === 'completed' ? (
                                      <>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Paid
                                      </>
                                    ) : (
                                      'Pending'
                                    )}
                                  </Badge>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      {/* Video player modal */}
      <VideoPlayer
        video={selectedVideo}
        open={videoPlayerOpen}
        onClose={() => setVideoPlayerOpen(false)}
        teacherName="Professor"
      />
    </div>
  );
}
