import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { AlertCircle } from "lucide-react";

export default function AdminGuard({ children }) {
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          setStatus("unauthorized");
          return;
        }

        const user = await base44.auth.me();
        if (!user) {
          setStatus("unauthorized");
          return;
        }

        // Check if user is admin
        if (user.role !== "admin") {
          setStatus("forbidden");
          return;
        }

        setStatus("authorized");
      } catch (err) {
        console.error("Admin check error:", err);
        setError(err.message);
        setStatus("error");
      }
    };

    checkAdminAccess();
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00d4ff]" />
          <p className="mt-4 text-gray-400">Verifying permissions...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-400 mb-8">You must be logged in to access this page.</p>
          <button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="px-6 py-3 bg-[#00d4ff] text-[#0a0e1a] font-bold rounded-lg hover:bg-[#00d4ff]/80"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-8">You do not have permission to access this resource. Admin access is required.</p>
          <button
            onClick={() => window.location.href = createPageUrl("Homepage")}
            className="px-6 py-3 bg-[#00d4ff] text-[#0a0e1a] font-bold rounded-lg hover:bg-[#00d4ff]/80"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-4 text-red-400">Error</h1>
          <p className="text-gray-400 mb-8">{error || "An error occurred while verifying access."}</p>
          <button
            onClick={() => window.location.href = createPageUrl("Homepage")}
            className="px-6 py-3 bg-[#00d4ff] text-[#0a0e1a] font-bold rounded-lg hover:bg-[#00d4ff]/80"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}