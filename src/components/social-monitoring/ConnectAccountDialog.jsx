import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const PLATFORMS = [
  { value: "linkedin", label: "LinkedIn", connector: "linkedin", icon: "💼" },
  { value: "tiktok", label: "TikTok", connector: "tiktok", icon: "🎵" },
  { value: "discord", label: "Discord", connector: "discord", icon: "💬" },
];

export default function ConnectAccountDialog({ open, onOpenChange }) {
  const [step, setStep] = useState(1);
  const [platform, setPlatform] = useState("");
  const [accountType, setAccountType] = useState("owned");
  const [accountName, setAccountName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [connecting, setConnecting] = useState(false);
  const queryClient = useQueryClient();

  const createAccountMutation = useMutation({
    mutationFn: (data) => base44.entities.SocialMediaAccount.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["socialMediaAccounts"] });
      toast.success("Account connected successfully!");
      resetAndClose();
    },
  });

  const resetAndClose = () => {
    setStep(1);
    setPlatform("");
    setAccountType("owned");
    setAccountName("");
    setAuthEmail("");
    onOpenChange(false);
  };

  const handleConnect = async () => {
    const selectedPlatform = PLATFORMS.find(p => p.value === platform);
    if (!selectedPlatform) return;

    setConnecting(true);

    try {
      // Request OAuth authorization
      await base44.connectors.requestAuthorization({
        integration_type: selectedPlatform.connector,
        reason: `To monitor ${accountType === "owned" ? "your" : "authorized"} ${selectedPlatform.label} account`,
        scopes: getRequiredScopes(selectedPlatform.connector),
      });

      // Create account record
      await createAccountMutation.mutateAsync({
        account_name: accountName,
        platform: platform,
        account_type: accountType,
        connector_type: selectedPlatform.connector,
        connection_status: "connected",
        authorized_by_email: accountType === "authorized_third_party" ? authEmail : undefined,
        authorization_date: new Date().toISOString(),
        scopes_granted: getRequiredScopes(selectedPlatform.connector),
        monitoring_enabled: true,
      });
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to connect account. Please try again.");
      setConnecting(false);
    }
  };

  const getRequiredScopes = (connector) => {
    const scopeMap = {
      linkedin: ["r_basicprofile", "r_emailaddress", "w_member_social"],
      tiktok: ["user.info.basic", "video.list"],
      discord: ["identify", "guilds", "email"],
    };
    return scopeMap[connector] || [];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d1220] border-white/10 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Connect Social Media Account</DialogTitle>
          <DialogDescription>
            Connect an account with OAuth authorization for secure API access
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label>Select Platform</Label>
              <div className="grid grid-cols-3 gap-3 mt-2">
                {PLATFORMS.map((p) => (
                  <Card
                    key={p.value}
                    className={`p-4 cursor-pointer transition-all ${
                      platform === p.value
                        ? "bg-[#00d4ff]/10 border-[#00d4ff]/40"
                        : "bg-[#0a0f1e] border-white/5 hover:border-white/10"
                    }`}
                    onClick={() => setPlatform(p.value)}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{p.icon}</div>
                      <p className="text-sm font-medium text-white">{p.label}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <Label>Account Type</Label>
              <RadioGroup value={accountType} onValueChange={setAccountType} className="mt-2">
                <div className="flex items-center space-x-2 bg-[#0a0f1e] p-3 rounded-lg border border-white/5">
                  <RadioGroupItem value="owned" id="owned" />
                  <Label htmlFor="owned" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium text-white">My Own Account</p>
                      <p className="text-xs text-gray-500">Monitor your personal or business account</p>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2 bg-[#0a0f1e] p-3 rounded-lg border border-white/5">
                  <RadioGroupItem value="authorized_third_party" id="third-party" />
                  <Label htmlFor="third-party" className="flex-1 cursor-pointer">
                    <div>
                      <p className="font-medium text-white">Third Party Account (Authorized)</p>
                      <p className="text-xs text-gray-500">Monitor account with explicit user permission</p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="text-sm text-blue-200">
                <p className="font-medium mb-1">OAuth Authorization Required</p>
                <p className="text-xs text-blue-300">
                  You'll be redirected to {PLATFORMS.find(p => p.value === platform)?.label || "the platform"} to authorize access. 
                  Only granted permissions will be used for monitoring.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={resetAndClose}>
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!platform}
                className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/80"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="accountName">Account Display Name</Label>
              <Input
                id="accountName"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="e.g., John Doe's LinkedIn"
                className="mt-2 bg-[#0a0f1e] border-white/5"
              />
            </div>

            {accountType === "authorized_third_party" && (
              <div>
                <Label htmlFor="authEmail">Account Owner Email</Label>
                <Input
                  id="authEmail"
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="owner@example.com"
                  className="mt-2 bg-[#0a0f1e] border-white/5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Email of the person who owns this account and granted authorization
                </p>
              </div>
            )}

            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
              <div className="text-sm text-green-200">
                <p className="font-medium mb-1">Privacy & Security</p>
                <ul className="text-xs text-green-300 space-y-1 list-disc list-inside">
                  <li>All data is encrypted and securely stored</li>
                  <li>You can revoke access at any time</li>
                  <li>Only requested permissions will be used</li>
                  <li>Account owner can remove authorization anytime</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                onClick={handleConnect}
                disabled={!accountName || (accountType === "authorized_third_party" && !authEmail) || connecting}
                className="bg-[#00d4ff] text-black hover:bg-[#00d4ff]/80"
              >
                {connecting ? "Connecting..." : "Connect Account"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}