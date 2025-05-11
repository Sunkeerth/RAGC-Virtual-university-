import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import BranchPage from "@/pages/branch-page";
import CheckoutPage from "@/pages/checkout-page";
import VrLabPage from "@/pages/vr-lab-page";
import TeacherPage from "@/pages/teacher-page";
import StudentProfilePage from "@/pages/student-profile-page";
import { ProtectedRoute } from "@/lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { DocumentUpload } from "@/components/DocumentUpload";

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
      {/* <ProtectedRoute path="/documents" component={DocumentUpload} /> */}

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
    </QueryClientProvider>
  );
}

export default App;
