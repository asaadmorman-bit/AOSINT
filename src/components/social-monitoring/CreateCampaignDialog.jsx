import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CreateCampaignDialog({ open, onOpenChange, accounts = [] }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [campaignType, setCampaignType] = useState("single_run");
  const [frequency, setFrequency] = useState("daily");
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [keywords, setKeywords] = useState("");
  const [alertKeywords, setAlertKeywords] = useState("");
  const [sentimentEnabled, setSentimentEnabled] = useState(true);
  const [threatEnabled, setThreatEnabled] = useState(true);
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.MonitoringCampaign.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitoringCampaigns"] });
      toast.success("Campaign created successfully!");
      resetAndClose();
    },
  });

  const resetAndClose = () => {
    setName("");
    setDescription("");
    setCampaignType("single_run");
    setFrequency("daily");
    setSelectedAccounts([]);
    setKeywords("");
    setAlertKeywords("");
    setSentimentEnabled(true);
    setThreatEnabled(true);
    onOpenChange(false);
  };

  const handleCreate = () => {
    createMutation.mutate({
      name,
      description,
      campaign_type: campaignType,
      status: "active",
      accounts: selectedAccounts,
      monitoring_frequency: campaignType === "continuous" ? frequency : undefined,
      keywords_tracked: keywords ? keywords.split(",").map(k => k.trim()) : [],
      alert_on_keywords: alertKeywords ? alertKeywords.split(",").map(k => k.trim()) : [],
      sentiment_analysis_enabled: sentimentEnabled,
      threat_detection_enabled: threatEnabled,
      start_date: new Date().toISOString(),
      findings_count: 0,
    });
  };

  const toggleAccount = (accountId) => {
    setSelectedAccounts(prev =>
      prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]
    );
  };

  const connectedAccounts = accounts.filter(a => a.connection_status === "connected");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d1220] border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create Monitoring Campaign</DialogTitle>
          <DialogDescription>
            Set up a new social media monitoring campaign
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Brand Reputation Monitor"
              className="mt-2 bg-[#0a0f1e] border-white/5"
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this campaign monitoring for?"
              className="mt-2 bg-[#0a0f1e] border-white/5"
              rows={2}
            />
          </div>

          <div>
            <Label>Campaign Type</Label>
            <RadioGroup value={campaignType} onValueChange={setCampaignType} className="mt-2">
              <div className="flex items-center space-x-2 bg-[#0a0f1e] p-3 rounded-lg border border-white/5">
                <RadioGroupItem value="single_run" id="single" />
                <Label htmlFor="single" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium text-white">Single Run</p>
                    <p className="text-xs text-gray-500">One-time snapshot analysis</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 bg-[#0a0f1e] p-3 rounded-lg border border-white/5">
                <RadioGroupItem value="continuous" id="continuous" />
                <Label htmlFor="continuous" className="flex-1 cursor-pointer">
                  <div>
                    <p className="font-medium text-white">Continuous Monitoring</p>
                    <p className="text-xs text-gray-500">Ongoing monitoring with regular scans</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {campaignType === "continuous" && (
            <div>
              <Label htmlFor="frequency">Monitoring Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="mt-2 bg-[#0a0f1e] border-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Select Accounts to Monitor</Label>
            {connectedAccounts.length === 0 ? (
              <p className="text-sm text-gray-500 mt-2">No connected accounts. Please connect accounts first.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {connectedAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center space-x-2 bg-[#0a0f1e] p-3 rounded-lg border border-white/5"
                  >
                    <Checkbox
                      id={account.id}
                      checked={selectedAccounts.includes(account.id)}
                      onCheckedChange={() => toggleAccount(account.id)}
                    />
                    <Label htmlFor={account.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <span>{account.account_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {account.platform}
                        </Badge>
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="keywords">Keywords to Track (comma-separated)</Label>
            <Input
              id="keywords"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g., brand name, product names, hashtags"
              className="mt-2 bg-[#0a0f1e] border-white/5"
            />
          </div>

          <div>
            <Label htmlFor="alertKeywords">Alert Keywords (comma-separated)</Label>
            <Input
              id="alertKeywords"
              value={alertKeywords}
              onChange={(e) => setAlertKeywords(e.target.value)}
              placeholder="e.g., crisis, breach, complaint"
              className="mt-2 bg-[#0a0f1e] border-white/5"
            />
            <p className="text-xs text-gray-500 mt-1">
              Generate immediate alerts when these keywords are detected
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sentiment"
                checked={sentimentEnabled}
                onCheckedChange={setSentimentEnabled}
              />
              <Label htmlFor="sentiment" className="cursor-pointer">
                Enable Sentiment Analysis
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="threat"
                checked={threatEnabled}
                onCheckedChange={setThreatEnabled}
              />
              <Label htmlFor="threat" className="cursor-pointer">
                Enable Threat Detection
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={resetAndClose}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name || selectedAccounts.length === 0 || createMutation.isPending}
              className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/80"
            >
              {createMutation.isPending ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}