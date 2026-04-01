import { useEffect, useState, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "@/services/api";

const AdminApprovePage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const hasApproved = useRef(false);

  useEffect(() => {
    const approveUser = async () => {
      if (hasApproved.current) return;

      if (!token) {
        setStatus("error");
        setMessage("Token d'approbation manquant.");
        return;
      }

      hasApproved.current = true;

      try {
        const response = await api.get(`/auth/approve-user?token=${token}`);
        setStatus("success");
        setMessage(response.data?.message || "Utilisateur approuvé avec succès.");
      } catch (error: any) {
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Une erreur est survenue lors de l'approbation."
        );
      }
    };

    approveUser();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Approbation utilisateur
          </h2>

          {status === "loading" && (
            <div className="mt-8 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}

          {status === "success" && (
            <div className="mt-8">
              <div className="text-green-500 text-5xl mb-4">&#10003;</div>
              <p className="text-gray-600 text-lg">{message}</p>
              <p className="text-gray-500 text-sm mt-4">
                L'utilisateur a été notifié par email et peut maintenant se connecter.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Se connecter
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="mt-8">
              <div className="text-red-500 text-5xl mb-4">&#10007;</div>
              <p className="text-gray-600 text-lg">{message}</p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Se connecter
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminApprovePage;
