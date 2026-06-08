import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SingleIOCForm from "./enrichment/SingleIOCForm";
import BatchIOCForm from "./enrichment/BatchIOCForm";
import EnrichmentResults from "./enrichment/EnrichmentResults";

export default function IOCEnrichmentPanel() {
  const [result, setResult] = useState(null);
  const queryClient = useQueryClient();

  const { data: playbooks = [] } = useQuery({
    queryKey: ["playbooks-active"],
    queryFn: () => base44.entities.Playbook.filter({ status: "active" }),
  });

  const { data: recentIndicators = [] } = useQuery({
    queryKey: ["recentIndicators"],
    queryFn: () => base44.entities.ThreatIndicator.list("-created_date", 8),
  });

  const enrichMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await base44.functions.invoke("enrichIOCWithThreatIntel", payload);
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.playbooks_updated?.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["playbooks-active"] });
      }
    },
  });

  return (
    <div className="space-y-5">
      <Tabs defaultValue="single">
        <TabsList className="bg-white/5 border border-white/5">
          <TabsTrigger value="single">Single IOC</TabsTrigger>
          <TabsTrigger value="batch">Batch Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="mt-4">
          <SingleIOCForm
            playbooks={playbooks}
            recentIndicators={recentIndicators}
            onSubmit={(payload) => enrichMutation.mutate(payload)}
            isLoading={enrichMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="batch" className="mt-4">
          <BatchIOCForm
            playbooks={playbooks}
            onSubmit={(payload) => enrichMutation.mutate(payload)}
            isLoading={enrichMutation.isPending}
          />
        </TabsContent>
      </Tabs>

      {result && <EnrichmentResults result={result} />}
    </div>
  );
}