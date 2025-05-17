// src/router.tsx
import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "@/lib/protected-route";
import {
  HomePage,
  AuthPage,
  BranchPage,
  StudentProfilePage,
  TeacherPage,
  VrLabPage,
  NotFound
} from "@/pages";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <ProtectedRoute><HomePage /></ProtectedRoute>,
  },
  {
    path: "/auth",
    element: <AuthPage />,
  },
  {
    path: "/branch/:id",
    element: <ProtectedRoute><BranchPage /></ProtectedRoute>,
  },
  {
    path: "/profile",
    element: <ProtectedRoute><StudentProfilePage /></ProtectedRoute>,
  },
  {
    path: "/teacher",
    element: <ProtectedRoute><TeacherPage /></ProtectedRoute>,
  },
  {
    path: "/vr-lab",
    element: <ProtectedRoute><VrLabPage /></ProtectedRoute>,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);