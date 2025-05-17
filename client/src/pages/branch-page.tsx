// src/pages/branch-page.tsx
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'wouter';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { VideoCard } from '@/components/video-card';
import { VideoPlayer } from '@/components/video-player';
import { Loader2, CheckCircle, GraduationCap, FlaskConical, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IBranch, IEquipmentKit, ISpecialization, IVideo } from '@shared/schema';

interface BranchData {
  branch: IBranch;
  equipmentKits: IEquipmentKit[];
  specializations: ISpecialization[];
}

export default function BranchPage() {
  const { id } = useParams();
  const branchId = parseInt(id || '0');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<IVideo | null>(null);
  const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);

  // Fetch branch data
  const { data: branchData, isLoading: branchLoading } = useQuery<BranchData>({
    queryKey: ['branch', branchId],
    queryFn: async () => {
      const res = await fetch(`/api/branches/${branchId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch branch data');
      return res.json();
    },
    enabled: !!branchId && !isNaN(branchId)
  });

  // Fetch branch videos
  const { data: videos, isLoading: videosLoading } = useQuery<IVideo[]>({
    queryKey: ['branch-videos', branchId],
    queryFn: async () => {
      const res = await fetch(`/api/branches/${branchId}/videos`, { credentials: 'include' });
      return res.ok ? await res.json() : [];
    },
    enabled: !!branchId && !isNaN(branchId)
  });

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const isLoading = branchLoading || videosLoading;

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header onToggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1 overflow-hidden">
        <div className={`${sidebarOpen ? 'block' : 'hidden'} lg:block`}>
          <Sidebar />
        </div>

        <main className="flex-1 overflow-y-auto bg-background pb-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : branchData ? (
            <div className="container py-8">
              {/* Branch Header */}
              <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold text-primary mb-4">
                  {branchData.branch.name}
                </h1>
                <p className="text-xl text-muted-foreground">
                  {branchData.branch.description}
                </p>
              </div>

              <Tabs defaultValue="curriculum" className="mb-8">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                  <TabsTrigger value="labs">VR Labs</TabsTrigger>
                  <TabsTrigger value="faculty">Faculty</TabsTrigger>
                </TabsList>

                {/* Curriculum Tab */}
                <TabsContent value="curriculum">
                  <div className="grid md:grid-cols-2 gap-6">
                    <CourseSection 
                      title="Core Courses"
                      courses={branchData.branch.courses}
                    />
                    <CourseSection
                      title="Specializations"
                      courses={branchData.specializations.map(s => s.name)}
                    />
                  </div>
                </TabsContent>

                {/* VR Labs Tab */}
                <TabsContent value="labs">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branchData.equipmentKits.map((kit) => (
                      <LabCard 
                        key={kit.id}
                        title={kit.name}
                        equipment={kit.equipmentList}
                      />
                    ))}
                  </div>
                </TabsContent>

                {/* Faculty Tab */}
                <TabsContent value="faculty">
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branchData.specializations.map((specialization) => (
                      <FacultyCard
                        key={specialization.id}
                        name={specialization.leadProfessor}
                        role={specialization.name}
                        expertise={specialization.keyAreas}
                      />
                    ))}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Videos Section */}
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-primary mb-6">Learning Resources</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {videos?.map((video) => (
                    <VideoCard 
                      key={video.id}
                      video={video}
                      onClick={setSelectedVideo}
                      restrictedAccess={video.restrictedAccess}
                    />
                  ))}
                </div>
              </section>

              {/* Enrollment CTA */}
              <div className="bg-primary/10 p-8 rounded-xl text-center">
                <h3 className="text-2xl font-semibold text-primary mb-4">
                  Ready to Start Your Journey?
                </h3>
                <p className="text-muted-foreground mb-6">
                  Join {branchData.branch.enrolledStudents}+ students already enrolled
                </p>
                <Button size="lg" onClick={() => window.location.href = `/checkout/${branchId}/1`}>
                  Enroll Now
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-destructive">
              <p>Branch not found. Please select a valid branch.</p>
            </div>
          )}
        </main>
      </div>

      <VideoPlayer
        video={selectedVideo}
        open={videoPlayerOpen}
        onClose={() => setVideoPlayerOpen(false)}
        teacherName="Professor"
      />
    </div>
  );
}

// Sub-components
const CourseSection = ({ title, courses }: { title: string; courses: string[] }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader>
      <CardTitle className="text-xl flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {courses.map((course) => (
        <div key={course} className="flex items-center">
          <Badge variant="outline" className="mr-3">
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
            Available
          </Badge>
          <span className="text-muted-foreground">{course}</span>
        </div>
      ))}
    </CardContent>
  </Card>
);

const LabCard = ({ title, equipment }: { title: string; equipment: string[] }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-primary" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {equipment.map((item) => (
          <div key={item} className="flex items-center text-muted-foreground">
            <span className="text-primary mr-2">▹</span>
            {item}
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

const FacultyCard = ({ name, role, expertise }: { name: string; role: string; expertise: string[] }) => (
  <Card className="hover:shadow-lg transition-shadow">
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        {name}
      </CardTitle>
      <p className="text-muted-foreground">{role}</p>
    </CardHeader>
    <CardContent>
      <div className="flex flex-wrap gap-2">
        {expertise.map((skill) => (
          <Badge key={skill} variant="outline">{skill}</Badge>
        ))}
      </div>
    </CardContent>
  </Card>
);