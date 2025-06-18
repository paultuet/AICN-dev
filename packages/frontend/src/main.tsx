import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { FeatureFlagsProvider } from "@/contexts/FeatureFlagsContext";
import { ConversationProvider } from "@/contexts/ConversationContext";
import { DialogStackProvider } from "@/components/ui/dialog";
import App from "./App.tsx";
import "@/index.css";
import ToastProvider from "./contexts/ToastContext.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // staleTime: 5 * 60 * 1000, // 5 minutes
      // gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FeatureFlagsProvider>
          <ConversationProvider>
            <DialogStackProvider>
              <ToastProvider>
                <App />
              </ToastProvider>
            </DialogStackProvider>
          </ConversationProvider>
        </FeatureFlagsProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
