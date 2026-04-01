import {
  Routes,
  Route,
  Navigate,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import React from "react";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import AdminPage from "@/pages/AdminPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import NotFoundPage from "@/pages/NotFoundPage";
import VerifyEmailPage from "@/pages/VerifyEmailPage";
import ResendVerificationPage from "@/pages/ResendVerificationPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import AdminApprovePage from "@/pages/AdminApprovePage";
import FileDownloadPage from "@/pages/FileDownloadPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth, useIsAdmin } from "@/contexts/AuthContext";

// Composant qui redirige les utilisateurs déjà authentifiés vers la page d'accueil
const AuthRedirect = ({ children }: { children: React.JSX.Element }) => {
  const { isAuthenticated, loading } = useAuth();

  // Pendant la vérification de l'authentification, afficher un loader
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Si déjà authentifié, rediriger vers la page d'accueil
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Sinon, afficher la page demandée
  return children;
};

function Root() {
  const isAdmin = useIsAdmin();
  return (
    <Routes>
      {/* Routes d'authentification (accessibles uniquement aux utilisateurs non connectés) */}
      <Route
        path="/login"
        element={
          <AuthRedirect>
            <LoginPage />
          </AuthRedirect>
        }
      />
      <Route
        path="/register"
        element={
          <AuthRedirect>
            <RegisterPage />
          </AuthRedirect>
        }
      />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/resend-verification" element={<ResendVerificationPage />} />
      <Route
        path="/forgot-password"
        element={
          <AuthRedirect>
            <ForgotPasswordPage />
          </AuthRedirect>
        }
      />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/admin/approve" element={<AdminApprovePage />} />

      {/* Routes protégées (accessibles uniquement aux utilisateurs connectés) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          {isAdmin && <Route path="admin" element={<AdminPage />} />}
          <Route path="files" element={<FileDownloadPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

const router = createBrowserRouter([{ path: "*", element: <Root /> }]);

export default function App() {
  return <RouterProvider router={router} />;
}
