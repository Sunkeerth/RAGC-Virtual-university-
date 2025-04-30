import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { ThreeScene } from '@/components/ui/three-scene';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, PlayCircle, Headset, Timer, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { EquipmentKit, VrSession } from '@shared/schema';

interface SessionData {
  equipmentId: number;
  progress: number;
  completed: boolean;
}

export default function VrLabPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [vrExperienceOpen, setVrExperienceOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<number | null>(null);
  const [activeSession, setActiveSession] = useState<SessionData | null>(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  
  // Fetch equipment kits for VR lab
  const { data: equipmentKits, isLoading: kitsLoading } = useQuery<EquipmentKit[]>({
    queryKey: ['/api/branches/1/equipment'], // Assuming branch 1 is Computer Science with VR equipment
    queryFn: async () => {
      // For demo, use the equipment kits from branch 1 (CS) if they exist
      const res = await fetch('/api/branches/1', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch equipment');
      }
      
      const data = await res.json();
      return data.equipmentKits || [];
    },
  });
  
  // Fetch user's VR sessions
  const { data: sessions, isLoading: sessionsLoading } = useQuery<VrSession[]>({
    queryKey: ['/api/vr-sessions'],
  });
  
  // Create VR session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (equipmentId: number) => {
      const res = await apiRequest('POST', '/api/vr-sessions', { equipmentId });
      return await res.json();
    },
    onSuccess: (session) => {
      setActiveSession({
        equipmentId: session.equipmentId,
        progress: 0,
        completed: false,
      });
      
      // Start session timer
      const id = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
      
      setIntervalId(id);
      
      toast({
        title: 'VR Session Started',
        description: 'Your VR lab session has begun.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Start Session',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Update VR session mutation
  const updateSessionMutation = useMutation({
    mutationFn: async (data: { id: number; session: Partial<VrSession> }) => {
      const res = await apiRequest('PUT', `/api/vr-sessions/${data.id}`, data.session);
      return await res.json();
    },
    onSuccess: () => {
      // Clear active session
      setActiveSession(null);
      setSessionTime(0);
      
      // Invalidate sessions query to refresh data
      queryClient.invalidateQueries({
        queryKey: ['/api/vr-sessions'],
      });
      
      toast({
        title: 'Session Complete',
        description: 'Your VR lab session has been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Save Session',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  const startVRExperience = (equipmentId: number) => {
    setSelectedEquipment(equipmentId);
    setVrExperienceOpen(true);
    
    // Create a new VR session
    createSessionMutation.mutate(equipmentId);
  };
  
  const endVRExperience = (completed: boolean = false) => {
    // Stop timer
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
    
    // Calculate progress (for demo, based on time spent)
    const progress = Math.min(Math.floor((sessionTime / 300) * 100), 100); // Max 100% after 5 minutes
    
    if (activeSession) {
      // Find the session ID from active sessions
      const activeVrSession = sessions?.find(s => 
        s.equipmentId === activeSession.equipmentId && 
        !s.endTime
      );
      
      if (activeVrSession) {
        // Update the session
        updateSessionMutation.mutate({
          id: activeVrSession.id,
          session: {
            progress,
            completed: completed || progress === 100,
          },
        });
      }
    }
    
    setVrExperienceOpen(false);
  };
  
  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);
  
  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get session status for an equipment
  const getSessionStatus = (equipmentId: number) => {
    if (!sessions) return null;
    
    // Find the most recent session for this equipment
    const equipmentSessions = sessions
      .filter(session => session.equipmentId === equipmentId)
      .sort((a, b) => (new Date(b.startTime).getTime() - new Date(a.startTime).getTime()));
    
    return equipmentSessions[0] || null;
  };
  
  const isLoading = kitsLoading || sessionsLoading;
  
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
            <h1 className="text-2xl font-bold mb-6">Virtual Reality Lab</h1>
            
            <Tabs defaultValue="equipment">
              <TabsList className="mb-6">
                <TabsTrigger value="equipment">Lab Equipment</TabsTrigger>
                <TabsTrigger value="sessions">My Sessions</TabsTrigger>
                <TabsTrigger value="help">Help</TabsTrigger>
              </TabsList>
              
              <TabsContent value="equipment">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !equipmentKits || equipmentKits.length === 0 ? (
                  <Card className="text-center p-8">
                    <CardHeader>
                      <CardTitle>No VR Lab Equipment Available</CardTitle>
                      <CardDescription>
                        The VR lab equipment will be available soon.
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {equipmentKits.map((kit) => {
                      const sessionStatus = getSessionStatus(kit.id);
                      
                      return (
                        <Card key={kit.id} className="overflow-hidden">
                          <CardHeader className="p-4 pb-0">
                            <CardTitle className="flex items-center text-lg">
                              <span className="material-icons text-primary mr-2">{kit.icon}</span>
                              {kit.name}
                            </CardTitle>
                            <CardDescription>{kit.description}</CardDescription>
                          </CardHeader>
                          <CardContent className="p-4">
                            {sessionStatus && (
                              <div className="mb-3">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Progress</span>
                                  <span>{sessionStatus.progress}%</span>
                                </div>
                                <Progress value={sessionStatus.progress} className="h-2" />
                                <div className="flex items-center mt-2 text-xs text-muted-foreground">
                                  <Timer className="h-3 w-3 mr-1" />
                                  <span>Last session: {new Date(sessionStatus.startTime).toLocaleDateString()}</span>
                                </div>
                              </div>
                            )}
                          </CardContent>
                          <CardFooter className="p-4 pt-0">
                            <Button 
                              onClick={() => startVRExperience(kit.id)}
                              className="w-full flex items-center"
                              disabled={createSessionMutation.isPending}
                            >
                              <Headset className="h-4 w-4 mr-2" />
                              {sessionStatus?.completed ? 'Revisit Lab' : 'Start Lab Experience'}
                            </Button>
                          </CardFooter>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="sessions">
                {sessionsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !sessions || sessions.length === 0 ? (
                  <Card className="text-center p-8">
                    <CardHeader>
                      <CardTitle>No Sessions Yet</CardTitle>
                      <CardDescription>
                        Start a VR lab experience to record your sessions.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Headset className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Your lab sessions help you track your progress and continue where you left off.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((session) => {
                      const kit = equipmentKits?.find(k => k.id === session.equipmentId);
                      
                      return (
                        <Card key={session.id} className="overflow-hidden">
                          <div className="flex flex-col md:flex-row">
                            <div className="p-4 flex-grow">
                              <div className="flex items-center mb-2">
                                {kit && (
                                  <span className="material-icons text-primary mr-2">{kit.icon}</span>
                                )}
                                <h3 className="font-medium">{kit?.name || `Equipment #${session.equipmentId}`}</h3>
                                {session.completed && (
                                  <Badge variant="success" className="ml-2">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex flex-col md:flex-row md:items-center text-sm text-muted-foreground mb-3 gap-2 md:gap-4">
                                <div className="flex items-center">
                                  <PlayCircle className="h-4 w-4 mr-1" />
                                  <span>Started: {new Date(session.startTime).toLocaleString()}</span>
                                </div>
                                {session.endTime && (
                                  <div className="flex items-center">
                                    <Timer className="h-4 w-4 mr-1" />
                                    <span>Duration: {formatTime(Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000))}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="mb-2">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Progress</span>
                                  <span>{session.progress}%</span>
                                </div>
                                <Progress value={session.progress} className="h-2" />
                              </div>
                            </div>
                            
                            <div className="p-4 md:border-l md:border-t-0 border-t border-border flex items-center justify-center">
                              <Button
                                onClick={() => startVRExperience(session.equipmentId)}
                                variant="outline"
                                className="flex items-center"
                              >
                                <Headset className="h-4 w-4 mr-2" />
                                {session.completed ? 'Review' : 'Continue'}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="help">
                <Card>
                  <CardHeader>
                    <CardTitle>VR Lab Help</CardTitle>
                    <CardDescription>
                      Learn how to get the most out of your VR lab experience
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Getting Started</h3>
                      <p className="text-muted-foreground">
                        Our VR Lab provides immersive learning experiences with interactive 3D models and simulations.
                        For the best experience, use a compatible VR headset, or navigate with your mouse and keyboard.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Controls</h3>
                      <ul className="list-disc list-inside text-muted-foreground space-y-1">
                        <li>Click and drag to rotate the view</li>
                        <li>Scroll to zoom in and out</li>
                        <li>Click on interactive elements to interact with them</li>
                        <li>Use the control panel to adjust settings</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Troubleshooting</h3>
                      <div className="bg-muted p-4 rounded-lg flex items-start">
                        <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                        <div>
                          <p className="font-medium">Performance Issues?</p>
                          <p className="text-sm text-muted-foreground">
                            If you experience performance issues, try lowering the quality settings, 
                            ensure your browser is up to date, and close other resource-intensive applications.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      View Detailed Documentation
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      
      {/* VR Experience Dialog */}
      <Dialog open={vrExperienceOpen} onOpenChange={(open) => {
        if (!open) endVRExperience();
      }}>
        <DialogContent className="max-w-4xl h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {equipmentKits?.find(kit => kit.id === selectedEquipment)?.name || 'VR Lab Experience'}
            </DialogTitle>
            <DialogDescription>
              Interact with the 3D model using your mouse or VR controls
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 min-h-0 flex flex-col">
            {/* VR Scene */}
            <div className="flex-1 bg-black rounded-md overflow-hidden">
              {selectedEquipment && (
                <ThreeScene equipmentId={selectedEquipment} className="w-full h-full" />
              )}
            </div>
            
            {/* Controls and session info */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-muted px-3 py-1 rounded-md flex items-center">
                  <Timer className="h-4 w-4 mr-2" />
                  <span className="font-mono">{formatTime(sessionTime)}</span>
                </div>
                
                <Progress 
                  value={Math.min((sessionTime / 300) * 100, 100)} 
                  className="w-32 h-2"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => endVRExperience(false)}
                >
                  Save & Exit
                </Button>
                <Button 
                  onClick={() => endVRExperience(true)}
                >
                  Complete Exercise
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Badge component for session status
const Badge = ({ 
  children, 
  variant = 'default' 
}: { 
  children: React.ReactNode; 
  variant?: 'default' | 'success' | 'warning' | 'error';
}) => {
  const variants = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-green-500/10 text-green-500',
    warning: 'bg-yellow-500/10 text-yellow-500',
    error: 'bg-red-500/10 text-red-500',
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
};
