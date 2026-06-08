import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function DiscordCommandRegistrar() {
  const [clientId, setClientId] = useState("");
  const [guildId, setGuildId] = useState("");
  const [result, setResult] = useState(null);

  const registerMutation = useMutation({
    mutationFn: async () => {
      const { data } = await base44.functions.invoke('registerDiscordCommands', {
        clientId,
        guildId,
      });
      return data;
    },
    onSuccess: (data) => {
      setResult({ success: true, data });
    },
    onError: (error) => {
      setResult({ success: false, error: error.message });
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Register Discord Slash Commands</h3>
        <p className="text-sm text-blue-800">
          This will register threat intelligence slash commands on your Discord server. You need your Discord Application Client ID and Guild ID.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-gray-700">Discord Client ID</Label>
          <Input
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            placeholder="Your Discord Application Client ID"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">Found in Discord Developer Portal → Applications → Your App → General Information</p>
        </div>

        <div>
          <Label className="text-gray-700">Guild ID (Server ID)</Label>
          <Input
            value={guildId}
            onChange={(e) => setGuildId(e.target.value)}
            placeholder="Your Discord Server/Guild ID"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">Enable Developer Mode in Discord → Right-click server → Copy Server ID</p>
        </div>

        <Button
          onClick={() => registerMutation.mutate()}
          disabled={!clientId || !guildId || registerMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {registerMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {registerMutation.isPending ? 'Registering...' : 'Register Commands'}
        </Button>
      </div>

      {result && (
        <div className={`border rounded-lg p-4 ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900">Success</h4>
                  <p className="text-sm text-green-800 mt-1">
                    {result.data.commands_registered} commands registered successfully
                  </p>
                  <div className="mt-3 text-xs text-green-700">
                    <strong>Registered commands:</strong>
                    <ul className="list-disc list-inside mt-1">
                      {result.data.commands && result.data.commands.map((cmd) => (
                        <li key={cmd.id}>{cmd.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-red-900">Registration Failed</h4>
                  <p className="text-sm text-red-800 mt-1">{result.error}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Commands Being Registered:</h4>
        <ul className="space-y-1 text-sm text-gray-700">
          <li>• <code className="bg-gray-200 px-2 py-0.5 rounded">/enrich-threat</code> - Get detailed enrichment for a threat</li>
          <li>• <code className="bg-gray-200 px-2 py-0.5 rounded">/search-threats</code> - Search for related threats</li>
          <li>• <code className="bg-gray-200 px-2 py-0.5 rounded">/correlate-threat</code> - Find correlated threats</li>
          <li>• <code className="bg-gray-200 px-2 py-0.5 rounded">/create-alert-rule</code> - Create a new alert rule</li>
          <li>• <code className="bg-gray-200 px-2 py-0.5 rounded">/list-alert-rules</code> - List all active alert rules</li>
          <li>• <code className="bg-gray-200 px-2 py-0.5 rounded">/delete-alert-rule</code> - Delete an alert rule</li>
        </ul>
      </div>
    </div>
  );
}