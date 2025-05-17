import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

import { queryClient } from "./lib/queryClient";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";

// Pages
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import BranchPage from "@/pages/branch-page";
import CheckoutPage from "@/pages/checkout-page";
import VrLabPage from "@/pages/vr-lab-page";
import TeacherPage from "@/pages/teacher-page";
import StudentProfilePage from "@/pages/student-profile-page";

// Components as Pages
import DocumentUpload from "@/components/DocumentUpload";
import { VideoPlayer } from "@/components/video-player";
import { VideoCard } from "@/components/video-card";
import { BranchCard } from "@/components/branch-card";
import { BranchDetails } from "@/components/branch-details";
import { PaymentForm } from "@/components/payment-form";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/branch/:id" component={BranchPage} />
      <ProtectedRoute path="/documents" component={DocumentUpload} />
      <ProtectedRoute path="/checkout/:branchId/:installment" component={CheckoutPage} />
      <ProtectedRoute path="/vr-lab" component={VrLabPage} />
      <ProtectedRoute path="/teacher" component={TeacherPage} />
      <ProtectedRoute path="/profile" component={StudentProfilePage} />
      <ProtectedRoute path="/video/:id" component={VideoPlayer} />
      <ProtectedRoute path="/video-card" component={VideoCard} />
      <ProtectedRoute path="/branch-card" component={BranchCard} />
      <ProtectedRoute path="/branch-details" component={BranchDetails} />
      <ProtectedRoute path="/payment-form" component={PaymentForm} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
