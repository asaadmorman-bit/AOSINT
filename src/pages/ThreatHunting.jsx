import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Crosshair, Loader2, RefreshCw, AlertTriangle, CheckCircle2, Clock, Search, Brain } from "lucide-react";
import HuntScanner from "@/components/hunting/HuntScanner";
import HuntTicketList from "@/components/hunting/HuntTicketList";
import HuntTicketDetail from "@/components/hunting/HuntTicketDetail";
import HuntingStats from "@/components/hunting/HuntingStats";
import IOCEnrichmentPanel from "@/components/hunting/IOCEnrichmentPanel";
import AnomalyDetectionPanel from "@/components/hunting/AnomalyDetectionPanel";

export default function ThreatHunting() {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [activeTab, setActiveTab] = useState("tickets");

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ["hunt-tickets"],
    queryFn: () => base44.entities.HuntTicket.list("-created_date"),
    refetchInterval: 30000,
  });

  const openTickets = tickets.filter(t => t.status === "open");
  const criticalTickets = tickets.filter(t => t.severity === "critical" && t.status !== "resolved");

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crosshair className="w-5 h-5 text-[#ff4757]" />
            <h1 className="text-lg font-bold text-white">Proactive Threat Hunting</h1>
            <Badge className="bg-[#ff4757]/10 text-[#ff4757] border border-[#ff4757]/20 text-[10px]">
              AI-POWERED
            </Badge>
          </div>
          <p className="text-xs text-gray-500">
            Autonomous scanning of historical and real-time data for anomalous patterns, TTP precursors and missed IOCs
          </p>
        </div>
        <div className="flex items-center gap-3">
          {criticalTickets.length > 0 && (
            <div className="flex items-center gap-1.5 bg-[#ff4757]/10 border border-[#ff4757]/20 rounded-lg px-3 py-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#ff4757]" />
              <span className="text-xs font-bold text-[#ff4757]">{criticalTickets.length} Critical</span>
            </div>
          )}
          {openTickets.length > 0 && (
            <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5">
              <Clock className="w-3.5 h-3.5 text-[#ffa502]" />
              <span className="text-xs text-gray-300">{openTickets.length} Open</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <HuntingStats tickets={tickets} />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white/5 border border-white/5">
          <TabsTrigger value="tickets" className="gap-1.5">
            <Search className="w-3 h-3" />
            Hunt Tickets
            {openTickets.length > 0 && (
              <span className="ml-1 text-[10px] bg-[#ffa502]/20 text-[#ffa502] rounded-full px-1.5 py-0.5">
                {openTickets.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="scan" className="gap-1.5">
            <Crosshair className="w-3 h-3" />
            Run Hunt Scan
          </TabsTrigger>
          <TabsTrigger value="enrich" className="gap-1.5">
            <Search className="w-3 h-3" />
            IOC Enrichment
          </TabsTrigger>
          <TabsTrigger value="anomaly" className="gap-1.5">
            <Brain className="w-3 h-3" />
            Anomaly Detection
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-5">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
            <div className="lg:col-span-2">
              <HuntTicketList
                tickets={tickets}
                isLoading={isLoading}
                selectedTicket={selectedTicket}
                onSelect={setSelectedTicket}
              />
            </div>
            <div className="lg:col-span-3">
              {selectedTicket ? (
                <HuntTicketDetail
                  ticket={selectedTicket}
                  onClose={() => setSelectedTicket(null)}
                  onUpdated={() => setSelectedTicket(null)}
                />
              ) : (
                <div className="bg-[#111827] border border-white/5 rounded-xl p-12 text-center h-full flex items-center justify-center">
                  <div>
                    <Crosshair className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">Select a ticket to review findings</p>
                    <p className="text-gray-600 text-xs mt-1">AI-surfaced anomalies and threat precursors await analysis</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="scan" className="mt-5">
          <HuntScanner onScanComplete={() => setActiveTab("tickets")} />
        </TabsContent>

        <TabsContent value="enrich" className="mt-5">
          <IOCEnrichmentPanel />
        </TabsContent>

        <TabsContent value="anomaly" className="mt-5">
          <AnomalyDetectionPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}