import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import authService from "@/services/auth";

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (hasVerified.current) {
        console.log("Vérification déjà effectuée, retour");
        return;
      }

      if (!token) {
        setStatus("error");
        setMessage("Token de vérification manquant.");
        return;
      }

      hasVerified.current = true;

      try {
        await authService.verifyEmail(token);
        setStatus("success");
        setMessage(
          "Email vérifié, vous pouvez maintenant vous connecter avec vos identifiants",
        );
      } catch (error: any) {
        setStatus("error");
        setMessage(
          error.response?.data?.message ||
            "Une erreur est survenue lors de la vérification de votre email.",
        );
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Vérification de votre email
          </h2>

          {status === "loading" && (
            <div className="mt-8 flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}

          {status === "success" && (
            <div className="mt-8">
              <div className="text-green-500 text-xl mb-4">
                ✓ Vérification réussie
              </div>
              <p className="text-gray-600">{message}</p>
              <button
                onClick={() => navigate("/login")}
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Aller à la page de connexion
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="mt-8">
              <div className="text-red-500 text-xl mb-4">
                ✗ Échec de la vérification
              </div>
              <p className="text-gray-600">{message}</p>
              <button
                onClick={() => navigate("/login")}
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Aller à la page de connexion
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
