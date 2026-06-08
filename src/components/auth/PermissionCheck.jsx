import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export default function PermissionCheck({ requiredAction, children, fallback = null }) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const user = await base44.auth.me();
        if (!user) {
          setHasPermission(false);
          setLoading(false);
          return;
        }

        // Check with backend RBAC enforcement
        const res = await base44.functions.invoke("enforceRBAC", {
          action: requiredAction,
          user_id: user.id,
        });

        setHasPermission(res.data?.allowed || false);
      } catch (error) {
        console.error("Permission check failed:", error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [requiredAction]);

  if (loading) {
    return null;
  }

  if (!hasPermission) {
    return fallback;
  }

  return <>{children}</>;
}