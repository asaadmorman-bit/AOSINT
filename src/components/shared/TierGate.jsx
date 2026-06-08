import React from "react";
import { AlertTriangle, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * TierGate Component — Enforces tier-based access to features.
 * Use this to wrap features that require specific tiers.
 */

const TIER_ORDER = ["community", "pro", "enterprise", "gov"];
const TIER_NAMES = { community: "Community", pro: "Pro", enterprise: "Enterprise", gov: "Gov/CI" };

// All tiers removed — everyone has full access
export default function TierGate({ children }) {
  return <>{children}</>;
}