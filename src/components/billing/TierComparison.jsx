import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TIERS = [
  { id: "community", label: "Community", price: 0, color: "#6b7280" },
  { id: "pro", label: "Pro", price: 99, color: "#00d4ff" },
  { id: "enterprise", label: "Enterprise", price: 499, color: "#a855f7", popular: true },
  { id: "gov", label: "Gov/CI", price: null, color: "#f59e0b" },
];

const FEATURES = [
  { label: "Threat Feed Ingestion", community: "Limited", pro: "Rate-limited", enterprise: "Unlimited (fair use)", gov: "Unlimited + Sovereign" },
  { label: "Core Dashboards", community: true, pro: true, enterprise: true, gov: true },
  { label: "Threat Indicators", community: "Basic", pro: true, enterprise: true, gov: true },
  { label: "Analytic Questions", community: false, pro: true, enterprise: true, gov: true },
  { label: "Researcher Mode", community: false, pro: "Add-on", enterprise: true, gov: true },
  { label: "Scenario Engine", community: false, pro: "Add-on", enterprise: true, gov: true },
  { label: "Red/Blue Cell Module", community: false, pro: "Add-on", enterprise: true, gov: true },
  { label: "Core Agents", community: false, pro: "Add-ons", enterprise: true, gov: true },
  { label: "Executive Dashboard", community: false, pro: true, enterprise: true, gov: true },
  { label: "Operator Mode", community: false, pro: true, enterprise: true, gov: true },
  { label: "Briefing Engine", community: false, pro: true, enterprise: true, gov: true },
  { label: "Fusion Center", community: false, pro: false, enterprise: true, gov: true },
  { label: "Compliance Engine", community: false, pro: "Add-on", enterprise: true, gov: true },
  { label: "Training Portal", community: false, pro: "Add-on", enterprise: true, gov: true },
  { label: "Premium Agents", community: false, pro: false, enterprise: "Add-on", gov: true },
  { label: "Sovereign Deployment", community: false, pro: false, enterprise: false, gov: true },
  { label: "Extended Retention", community: false, pro: false, enterprise: "Add-on", gov: true },
  { label: "Custom SLA", community: false, pro: false, enterprise: false, gov: true },
  { label: "FedRAMP / CJIS Compliance", community: false, pro: false, enterprise: false, gov: true },
  { label: "Team Seats", community: "1", pro: "5 incl.", enterprise: "25 incl.", gov: "Custom" },
];

function Cell({ value, color }) {
  if (value === true) return <CheckCircle2 className="w-4 h-4 mx-auto" style={{ color: color || "#2ed573" }} />;
  if (value === false) return <XCircle className="w-3.5 h-3.5 mx-auto text-gray-700" />;
  return <span className="text-[10px] font-medium" style={{ color: value === "Add-on" ? "#ffa502" : "#9ca3af" }}>{value}</span>;
}

export default function TierComparison({ currentTier }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <th className="text-[10px] text-gray-600 font-bold uppercase pb-4 pr-4 w-48">Feature</th>
            {TIERS.map(t => (
              <th key={t.id} className={`pb-4 px-3 text-center relative ${t.popular ? "bg-[#a855f7]/5 rounded-t-xl" : ""}`}>
                {t.popular && (
                  <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] bg-[#a855f7] text-white px-2 py-0.5 rounded-full font-bold">POPULAR</span>
                )}
                <p className="text-xs font-bold" style={{ color: t.color }}>{t.label}</p>
                <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                  {t.price === null ? "Custom" : t.price === 0 ? "Free" : `$${t.price}/mo`}
                </p>
                {currentTier === t.id && (
                  <span className="text-[8px] bg-white/10 text-gray-400 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">CURRENT</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FEATURES.map((feat, i) => (
            <tr key={feat.label} className={`border-t border-white/3 ${i % 2 === 0 ? "bg-white/1" : ""}`}>
              <td className="py-2.5 pr-4 text-[11px] text-gray-400">{feat.label}</td>
              {TIERS.map(t => (
                <td key={t.id} className={`py-2.5 px-3 text-center ${t.popular ? "bg-[#a855f7]/3" : ""}`}>
                  <Cell value={feat[t.id]} color={t.color} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="pt-4" />
            {TIERS.map(t => (
              <td key={t.id} className={`pt-4 px-3 text-center ${t.popular ? "bg-[#a855f7]/5 rounded-b-xl" : ""}`}>
                {currentTier !== t.id && t.id !== "community" && (
                  <Link to={createPageUrl("Pricing")}
                    className="inline-block text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                    style={{ background: `${t.color}15`, color: t.color, border: `1px solid ${t.color}20` }}>
                    {t.id === "gov" ? "Contact Sales" : "Upgrade"}
                  </Link>
                )}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}