import React, { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Settings, Code, CheckCircle2 } from "lucide-react";

export default function SDKIntegrationPanel({ sdks, dataSources }) {
  const [expandedSdk, setExpandedSdk] = useState(null);

  const sdksByVendor = {};
  sdks.forEach((sdk) => {
    if (!sdksByVendor[sdk.vendor]) {
      sdksByVendor[sdk.vendor] = [];
    }
    sdksByVendor[sdk.vendor].push(sdk);
  });

  return (
    <div className="space-y-6">
      {/* Create SDK Form */}
      <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
        <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
          <Code className="w-4 h-4" />
          Create Custom SDK
        </Button>
      </div>

      {/* SDK Library */}
      {Object.entries(sdksByVendor).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(sdksByVendor).map(([vendor, vendorSdks]) => (
            <div key={vendor} className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3 capitalize">
                {vendor} Integrations
              </h3>
              <div className="space-y-2">
                {vendorSdks.map((sdk) => (
                  <div
                    key={sdk.id}
                    className="bg-slate-800/50 border border-slate-700/30 rounded p-3 hover:border-cyan-500/30 transition cursor-pointer"
                    onClick={() =>
                      setExpandedSdk(expandedSdk?.id === sdk.id ? null : sdk)
                    }
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-white font-semibold">{sdk.sdk_name}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {sdk.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {sdk.status === "production" && (
                          <CheckCircle2 className="w-4 h-4 text-green-400" />
                        )}
                        <Badge
                          className={`text-[8px] ${
                            sdk.status === "production"
                              ? "bg-green-900/30 text-green-300 border-green-500/20"
                              : "bg-yellow-900/30 text-yellow-300 border-yellow-500/20"
                          }`}
                        >
                          {sdk.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge className="bg-slate-700/30 text-gray-300 border-slate-600/30 text-[8px]">
                        {sdk.language}
                      </Badge>
                      <Badge className="bg-slate-700/30 text-gray-300 border-slate-600/30 text-[8px]">
                        v{sdk.version}
                      </Badge>
                      <Badge className="bg-slate-700/30 text-gray-300 border-slate-600/30 text-[8px]">
                        {sdk.sdk_type}
                      </Badge>
                    </div>

                    {expandedSdk?.id === sdk.id && (
                      <div className="mt-3 pt-3 border-t border-slate-700/30 space-y-2 text-xs">
                        {sdk.endpoints && (
                          <div>
                            <p className="text-gray-400 font-semibold mb-1">Endpoints</p>
                            <div className="bg-black/30 p-2 rounded text-gray-300 max-h-24 overflow-y-auto">
                              {sdk.endpoints.map((ep, idx) => (
                                <p key={idx}>
                                  {ep.method} {ep.name}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                        {sdk.performance_metrics && (
                          <div>
                            <p className="text-gray-400 font-semibold mb-1">
                              Performance
                            </p>
                            <p className="text-gray-300">
                              {sdk.performance_metrics}
                            </p>
                          </div>
                        )}
                        <div className="flex gap-2 mt-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-xs"
                          >
                            Deploy
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs"
                          >
                            View Docs
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center text-gray-500 py-8">
          No SDK integrations available. Create a custom SDK to extend capabilities.
        </div>
      )}
    </div>
  );
}