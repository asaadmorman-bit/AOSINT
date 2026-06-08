import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { AlertCircle } from "lucide-react";

export default function PermissionGuard({ permission, children, fallback }) {
  const [allowed, setAllowed] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const { data } = await base44.functions.invoke('checkUserPermission', { permission });
        setAllowed(data.allowed);
      } catch (error) {
        console.error('Permission check failed:', error);
        setAllowed(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [permission]);

  if (loading) {
    return <div className="text-xs text-gray-500 animate-pulse">Checking permissions...</div>;
  }

  if (!allowed) {
    return fallback || (
      <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-yellow-600" />
        <span className="text-sm text-yellow-700">Permission check in progress or unavailable.</span>
      </div>
    );
  }

  return children;
}