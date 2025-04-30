import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/header';
import { Sidebar } from '@/components/sidebar';
import { BranchCard } from '@/components/branch-card';
import { Loader2 } from 'lucide-react';
import { Branch } from '@shared/schema';

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const { data: branches, isLoading, error } = useQuery<Branch[]>({
    queryKey: ['/api/branches'],
  });
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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
          <div className="px-4 py-6">
            <h1 className="text-2xl font-bold mb-6">Explore Branches</h1>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="text-center py-12 text-destructive">
                <p>Error loading branches. Please try again later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {branches?.map((branch) => (
                  <BranchCard key={branch.id} branch={branch} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
