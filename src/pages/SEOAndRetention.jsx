import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Zap, TrendingUp, Users, AlertCircle, CheckCircle2, Shield } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

export default function SEOAndRetention() {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState({});
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const implementMutation = useMutation({
    mutationFn: async (suggestions) => {
      return await base44.functions.invoke('implementSEOSuggestions', { suggestions });
    },
    onSuccess: () => {
      setSelectedSuggestions({});
    }
  });

  const startAnalysis = async () => {
    setLoading(true);
    try {
      const conversation = await base44.agents.createConversation({
        agent_name: "seo_retention_analyzer",
        metadata: {
          name: "SEO & Retention Analysis",
          description: "Analyzing platform for SEO and user retention optimization"
        }
      });
      setConversationId(conversation.id);

      const message = await base44.agents.addMessage(conversation, {
        role: "user",
        content: "Run a comprehensive SEO and user retention analysis of the ASOSINT threat intelligence platform. Focus on: 1) SEO optimization to attract clients, 2) User acquisition strategies, 3) User retention improvements, 4) Implementation roadmap with quick wins and long-term strategies."
      });

      setMessages(conversation.messages || [message]);
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (conversationId) {
      const unsubscribe = base44.agents.subscribeToConversation(conversationId, (data) => {
        setMessages(data.messages || []);
      });
      return unsubscribe;
    }
  }, [conversationId]);

  const isEds360 = user?.email?.endsWith('@eds-360.com');
  const isAdmin = user?.role === 'admin';
  const hasAccess = isAdmin || isEds360;
  const selectedCount = Object.values(selectedSuggestions).filter(Boolean).length;

  if (user && !hasAccess) {
    return (
      <div className="max-w-2xl mx-auto mt-20 text-center space-y-4">
        <Shield className="w-12 h-12 text-gray-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Access Restricted</h2>
        <p className="text-gray-400 text-sm">This page is only available to platform administrators and EDS-360 team members.</p>
      </div>
    );
  }

  const extractSuggestions = (text) => {
    const suggestionPattern = /(?:•|-|✓|\d+\))\s*(.+?)(?=(?:•|-|✓|\d+\)|$))/gs;
    const matches = text.match(suggestionPattern) || [];
    return matches.map((m, idx) => ({
      id: `${idx}-${Date.now()}`,
      text: m.replace(/^(?:•|-|✓|\d+\))\s*/, '').trim()
    })).filter(s => s.text.length > 10);
  };

  const handleImplement = async () => {
    const selectedList = Object.entries(selectedSuggestions)
      .filter(([_, selected]) => selected)
      .map(([id]) => id);
    
    if (selectedList.length === 0) return;
    
    implementMutation.mutate(selectedList);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-[#00d4ff]" />
          <h1 className="text-3xl font-bold text-white">SEO & User Retention Analysis</h1>
        </div>
        <p className="text-sm text-gray-400">
          AI-powered analysis to optimize the platform for client attraction and user retention
        </p>
      </div>

      {!conversationId ? (
        <Card className="bg-[#0d1220] border-[#00d4ff]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#00d4ff]" />
              Launch Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-400">
              This agent will analyze the ASOSINT platform and provide strategic recommendations for:
            </p>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#00d4ff] mt-0.5 shrink-0" />
                SEO optimization to improve search visibility
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#00d4ff] mt-0.5 shrink-0" />
                User acquisition strategies for client growth
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#00d4ff] mt-0.5 shrink-0" />
                User retention and engagement improvements
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#00d4ff] mt-0.5 shrink-0" />
                Implementation roadmap with prioritized actions
              </li>
            </ul>
            <Button
              onClick={startAnalysis}
              disabled={loading}
              className="w-full bg-[#00d4ff] text-black hover:bg-[#0099cc]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Starting Analysis...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Run SEO & Retention Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="bg-[#0d1220] border border-white/5 rounded-xl p-6 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#00d4ff] mx-auto mb-2" />
                <p className="text-gray-400">Agent is analyzing the platform...</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => {
                const suggestions = msg.role === "assistant" ? extractSuggestions(msg.content || "") : [];
                
                return (
                  <Card key={idx} className={`bg-${msg.role === "user" ? "[#1a2440]" : "[#0d1220]"} border-white/5`}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className={msg.role === "user" ? "bg-blue-500/10 text-blue-400" : "bg-[#00d4ff]/10 text-[#00d4ff]"}>
                          {msg.role === "user" ? "Your Request" : "AI Analysis"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="prose prose-invert max-w-none text-sm text-gray-300">
                        {msg.content ? (
                          <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, "<br>") }} />
                        ) : (
                          <p className="text-gray-500">Processing analysis...</p>
                        )}
                      </div>
                      
                      {isAdmin && suggestions.length > 0 && (
                        <div className="border-t border-white/10 pt-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-white text-sm">Implementation Actions ({selectedCount} selected)</h3>
                            {selectedCount > 0 && (
                              <Button
                                onClick={handleImplement}
                                disabled={implementMutation.isPending}
                                size="sm"
                                className="bg-[#2ed573] text-black hover:bg-[#1fb861]"
                              >
                                {implementMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                    Implementing...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Push {selectedCount} Change{selectedCount !== 1 ? 's' : ''}
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {suggestions.map((suggestion) => (
                              <label key={suggestion.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
                                <Checkbox
                                  checked={selectedSuggestions[suggestion.id] || false}
                                  onCheckedChange={(checked) => {
                                    setSelectedSuggestions(prev => ({
                                      ...prev,
                                      [suggestion.id]: checked
                                    }));
                                  }}
                                  className="mt-0.5"
                                />
                                <span className="text-xs text-gray-300 flex-1">{suggestion.text}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}