import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";

export default function ProtectedRoute({ children, requiredTier = null }) {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        
        if (!isAuth) {
          setStatus("unauthorized");
          return;
        }

        const currentUser = await base44.auth.me();
        
        if (!currentUser) {
          setStatus("unauthorized");
          return;
        }

        // Check tier requirement if specified
        if (requiredTier) {
          const tierOrder = ["community", "pro", "enterprise", "gov"];
          const userTierIndex = tierOrder.indexOf(currentUser.tier || "community");
          const requiredIndex = tierOrder.indexOf(requiredTier);

          if (userTierIndex < requiredIndex) {
            setStatus("insufficient_tier");
            setUser(currentUser);
            return;
          }
        }

        setUser(currentUser);
        setStatus("authorized");
      } catch (err) {
        setStatus("error");
        setError(err.message);
      }
    };

    checkAuth();
  }, [requiredTier]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#00d4ff]" />
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthorized") {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">Authentication Required</h1>
          <p className="text-gray-400 mb-8">
            You must be logged in to access this page. Please sign in with your account.
          </p>
          <button
            onClick={() => base44.auth.redirectToLogin(window.location.href)}
            className="px-6 py-3 bg-[#00d4ff] text-[#0a0e1a] font-bold rounded-lg hover:bg-[#00d4ff]/80 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (status === "insufficient_tier") {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">Upgrade Required</h1>
          <p className="text-gray-400 mb-4">
            This feature requires a {requiredTier ? requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1) : "higher"} tier subscription.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Current tier: <span className="text-[#00d4ff] font-bold capitalize">{user?.tier || "Community"}</span>
          </p>
          <button
            onClick={() => window.location.href = createPageUrl("Pricing")}
            className="px-6 py-3 bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/20 font-bold rounded-lg hover:bg-[#00d4ff]/20 transition-colors"
          >
            View Upgrade Options
          </button>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4 text-red-400">Error</h1>
          <p className="text-gray-400 mb-8">{error || "An error occurred while checking your authentication."}</p>
          <button
            onClick={() => window.location.href = createPageUrl("Homepage")}
            className="px-6 py-3 bg-[#00d4ff] text-[#0a0e1a] font-bold rounded-lg hover:bg-[#00d4ff]/80 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  // User is authorized
  return <>{children}</>;
}