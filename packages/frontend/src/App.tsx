import {
  Routes,
  Route,
  Navigate,
  createBrowserRouter,
  RouterProvider,
  useRouteError,
} from "react-router-dom";
import React, { useEffect } from "react";
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
import JournalPage from "@/pages/JournalPage";
import SimulateurDcPage from "@/pages/SimulateurDcPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth, useIsAdmin } from "@/contexts/AuthContext";
import { track } from "@/services/telemetry";

function AppErrorBoundary() {
  const error = useRouteError() as Error | undefined;
  const message = error?.message ?? "Erreur inconnue";
  const stack = error?.stack ?? "";

  useEffect(() => {
    track("frontend-crash", {
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      // Truncate stack to keep payload reasonable.
      stack: stack.slice(0, 2000),
    });
  }, [message, stack]);

  // NotFoundError on removeChild is the signature of a DOM-mutating extension
  // (Chrome auto-translate, Grammarly, etc.) breaking React's reconciliation.
  const looksLikeTranslateBug = /removeChild|insertBefore|NotFoundError/i.test(message);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 border border-gray-100">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <h1 className="text-xl font-bold text-center mb-3 text-gray-900">
          Une erreur est survenue
        </h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          {looksLikeTranslateBug ? (
            <>
              Une extension de votre navigateur (souvent <strong>la traduction automatique de Chrome</strong>)
              interfère avec la page. Essayez l'une des solutions ci-dessous.
            </>
          ) : (
            <>L'application a rencontré un problème inattendu. Recharger la page suffit le plus souvent.</>
          )}
        </p>
        {looksLikeTranslateBug && (
          <ul className="text-sm text-gray-600 mb-6 space-y-2 pl-5 list-disc">
            <li>Cliquez sur l'icône <em>traduction</em> à droite de la barre d'adresse et choisissez « Afficher la page d'origine » ou « Ne jamais traduire ce site ».</li>
            <li>Ou désactivez temporairement les extensions qui modifient les pages (Grammarly, traducteurs, etc.).</li>
            <li>Puis rechargez la page.</li>
          </ul>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-2 px-4 rounded-lg bg-secondary text-white font-medium hover:bg-secondary-hover transition-colors"
          >
            Recharger la page
          </button>
          <button
            onClick={() => { window.location.href = "/login"; }}
            className="flex-1 py-2 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Page de connexion
          </button>
        </div>
        <details className="mt-6 text-xs text-gray-400">
          <summary className="cursor-pointer">Détails techniques</summary>
          <pre className="mt-2 whitespace-pre-wrap break-words">{message}</pre>
        </details>
      </div>
    </div>
  );
}

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
          <Route path="journal" element={<JournalPage />} />
          <Route path="simulateur" element={<SimulateurDcPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

const router = createBrowserRouter([
  { path: "*", element: <Root />, errorElement: <AppErrorBoundary /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
