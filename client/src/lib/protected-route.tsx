import { useAuth } from "@/hooks/use-auth";
import { useLocation, Route } from "wouter";
import { Loader2 } from "lucide-react";

type ProtectedRouteProps = {
  path: string;
  component: React.ComponentType<any>; // Allows route params
};

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // Redirect to /auth if user is not authenticated
  if (!user && location !== "/auth") {
    setTimeout(() => setLocation("/auth"), 0);
    return null;
  }

  // Redirect authenticated user away from /auth
  if (user && location === "/auth") {
    setTimeout(() => setLocation("/"), 0);
    return null;
  }

  // Render the protected component
  return (
    <Route path={path}>
      {(params) => <Component {...params} />}
    </Route>
  );
}
