import React from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TIER_COLORS = {
  community: { color: "#6b7280", label: "Community" },
  pro: { color: "#00d4ff", label: "Pro" },
  enterprise: { color: "#a855f7", label: "Enterprise" },
  gov: { color: "#f59e0b", label: "Gov / CI" },
};

export default function TierGate({ requiredTier, children, userTier }) {
  // All channels available to community - no tier gates
  return <>{children}</>;
}