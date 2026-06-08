import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Linkedin, Send, Bot, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function LinkedInShareButton({ prefillContent = "", report = null, insightMode = false }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(prefillContent);
  const [generating, setGenerating] = useState(false);
  const [posting, setPosting] = useState(false);
  const [status, setStatus] = useState(null); // "success" | "error"
  const [postToFeed, setPostToFeed] = useState(true);
  const [groups, setGroups] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedOrgs, setSelectedOrgs] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  useEffect(() => {
    if (open && groups.length === 0 && !loadingGroups) {
      fetchGroups();
    }
  }, [open]);

  const fetchGroups = async () => {
    setLoadingGroups(true);
    try {
      const res = await base44.functions.invoke('getLinkedInGroups', {});
      setGroups(res.data?.groups || []);
      setOrganizations(res.data?.organizations || []);
    } catch (error) {
      console.error('Failed to fetch groups and organizations:', error);
      setGroups([]);
      setOrganizations([]);
    }
    setLoadingGroups(false);
  };

  const generatePost = async () => {
    setGenerating(true);
    let reportContext;
    if (insightMode && report) {
      reportContext = `ASOSINT Platform Security Snapshot:
- Total indicators tracked: ${report.totalIndicators}
- Dark web leaks detected: ${report.darkWebLeaks}
- Active investigations: ${report.activeInvestigations}
- Critical alerts: ${report.criticalAlerts}
- High-severity alerts: ${report.highAlerts}
- Recent leak titles: ${report.topLeaks || "None"}`;
    } else if (report) {
      reportContext = `Report Title: ${report.title}
Report Type: ${report.report_type?.replace(/_/g, " ")}
Executive Summary: ${report.executive_summary || "N/A"}
Key Findings: ${(report.key_findings || []).join("; ") || "N/A"}
Risks: ${(report.risks || []).join("; ") || "N/A"}
Recommended Actions: ${(report.recommended_actions || []).join("; ") || "N/A"}`;
    } else {
      reportContext = "General OSINT threat intelligence assessment from ASOSINT platform";
    }

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Write a professional LinkedIn post sharing the following ${insightMode ? "security insights" : "threat intelligence report"} from ASOSINT (asosint.io).

${reportContext}

The post should:
- Be 150-250 words
- Reference the actual data/findings above specifically
- Sound authoritative but accessible to security professionals
- Include 3-4 relevant hashtags (#ThreatIntel #OSINT #CyberSecurity etc.)
- End with a subtle mention of ASOSINT platform
- Be engaging and encourage discussion
Do NOT use emojis excessively. Keep it professional.`,
      add_context_from_internet: false,
    });
    setContent(res);
    setGenerating(false);
  };

  const handlePost = async () => {
    setPosting(true);
    setStatus(null);
    try {
      const res = await base44.functions.invoke('shareToLinkedIn', {
        content,
        postToFeed,
        groupIds: selectedGroups,
        organizationIds: selectedOrgs
      });
      if (res.data?.success) {
        setStatus("success");
        setTimeout(() => { setOpen(false); setStatus(null); }, 2500);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
    setPosting(false);
  };

  const toggleGroup = (groupId) => {
    setSelectedGroups(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  const toggleOrg = (orgId) => {
    setSelectedOrgs(prev =>
      prev.includes(orgId) ? prev.filter(id => id !== orgId) : [...prev, orgId]
    );
  };

  return (
    <>
      <Button onClick={() => { setOpen(true); setContent(prefillContent); setStatus(null); }}
        className="bg-[#0077b5]/20 border border-[#0077b5]/30 text-[#0077b5] hover:bg-[#0077b5]/30 gap-2 text-sm">
        <Linkedin className="w-4 h-4" /> Share to LinkedIn
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#0d1220] border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Linkedin className="w-5 h-5 text-[#0077b5]" />
                <p className="text-sm font-bold text-white">Share Threat Intel to LinkedIn</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300"><X className="w-4 h-4" /></button>
            </div>

            <Button onClick={generatePost} disabled={generating}
              className="w-full bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/20 gap-2 text-sm">
              <Bot className="w-4 h-4" />{generating ? "Generating AI post..." : "Generate AI Threat Intel Post"}
            </Button>

            <textarea
              className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-200 resize-none h-32 focus:outline-none focus:border-[#0077b5]/40"
              placeholder="Write your LinkedIn post here, or generate one with AI above..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <p className="text-[10px] text-gray-600 text-right">{content.length} characters</p>

            <div className="border-t border-white/5 pt-3 space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-300">Post to:</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/8 cursor-pointer transition-colors"
                  onClick={() => setPostToFeed(!postToFeed)}>
                  <input type="checkbox" checked={postToFeed} onChange={e => setPostToFeed(e.target.checked)} className="cursor-pointer" />
                  <span className="text-sm text-gray-300">My Feed</span>
                </div>
              </div>

              {organizations.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Company Pages ({selectedOrgs.length}):</label>
                  <div className="max-h-40 overflow-y-auto space-y-1 bg-white/5 rounded-lg p-2">
                    {organizations.map(org => (
                      <div key={org.id} className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => toggleOrg(org.id)}>
                        <input type="checkbox" checked={selectedOrgs.includes(org.id)} onChange={e => e.stopPropagation()} className="cursor-pointer mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 truncate font-medium">{org.name}</p>
                          {org.url && <p className="text-[10px] text-gray-500 truncate">{org.url}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {groups.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">LinkedIn Groups ({selectedGroups.length}):</label>
                  <div className="max-h-40 overflow-y-auto space-y-1 bg-white/5 rounded-lg p-2">
                    {groups.map(group => (
                      <div key={group.id} className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
                        onClick={() => toggleGroup(group.id)}>
                        <input type="checkbox" checked={selectedGroups.includes(group.id)} onChange={e => e.stopPropagation()} className="cursor-pointer mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-200 truncate font-medium">{group.name}</p>
                          <p className="text-[10px] text-gray-500">{group.memberCount} members</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {loadingGroups && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading organizations & groups...
                </div>
              )}
            </div>

            {status === "success" && (
              <div className="px-4 py-2.5 rounded-lg bg-[#2ed573]/10 border border-[#2ed573]/20 text-sm text-[#2ed573] font-semibold">
                ✓ Posted successfully to LinkedIn!
              </div>
            )}
            {status === "error" && (
              <div className="px-4 py-2.5 rounded-lg bg-red-900/20 border border-red-500/20 text-sm text-red-400">
                Failed to post. Please try again.
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setOpen(false)} className="text-gray-400 text-sm">Cancel</Button>
              <Button onClick={handlePost} disabled={!content.trim() || posting || (!postToFeed && selectedGroups.length === 0 && selectedOrgs.length === 0)}
                className="bg-[#0077b5] hover:bg-[#006097] text-white font-bold text-sm gap-2">
                <Send className="w-4 h-4" />{posting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}