import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Clock, Image, Send, Loader2, Trash2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LinkedInPostScheduler() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [availableOrgs, setAvailableOrgs] = useState([]);

  const [form, setForm] = useState({
    title: "",
    content: "",
    report_id: "",
    scheduled_date: "",
    scheduled_time: "09:00",
    post_to_personal: true,
    company_pages: [],
    media_urls: "",
  });

  // Fetch current user and orgs
  React.useEffect(() => {
    const initUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user?.email || "");
      await fetchAvailableOrgs();
    };
    initUser();
  }, []);

  const fetchAvailableOrgs = async () => {
    try {
      // This would require LinkedIn connector to fetch orgs
      // For now, users can manually add org IDs
      setAvailableOrgs([]);
    } catch (err) {
      console.error("Error fetching orgs:", err);
    }
  };

  const { data: scheduledPosts = [] } = useQuery({
    queryKey: ["linkedInScheduled"],
    queryFn: () => base44.entities.LinkedInScheduledPost.list("-created_date", 50),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ["osintReports"],
    queryFn: () => base44.entities.OsintReport.filter({}, "-created_date", 20),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LinkedInScheduledPost.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["linkedInScheduled"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LinkedInScheduledPost.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["linkedInScheduled"] }),
  });

  const resetForm = () => {
    setForm({
      title: "",
      content: "",
      report_id: "",
      scheduled_date: "",
      scheduled_time: "09:00",
      post_to_personal: true,
      company_pages: [],
      media_urls: "",
    });
    setShowForm(false);
  };

  const handleSubmit = () => {
    const scheduledDateTime = `${form.scheduled_date}T${form.scheduled_time}:00`;

    const data = {
      title: form.title,
      content: form.content,
      report_id: form.report_id,
      scheduled_for: scheduledDateTime,
      post_to_personal: form.post_to_personal,
      company_pages: form.company_pages.map(page => ({
        org_id: page.id,
        org_name: page.name,
      })),
      media_urls: form.media_urls ? form.media_urls.split(",").map(url => url.trim()).filter(Boolean) : [],
      created_by: currentUser,
      status: "scheduled",
    };

    createMutation.mutate(data);
  };

  const toggleCompanyPage = (page) => {
    setForm({
      ...form,
      company_pages: form.company_pages.find(p => p.id === page.id)
        ? form.company_pages.filter(p => p.id !== page.id)
        : [...form.company_pages, page],
    });
  };

  const handlePopulateFromReport = (reportId) => {
    const report = reports.find(r => r.id === reportId);
    if (report) {
      setForm({
        ...form,
        title: `Threat Intel: ${report.title}`,
        content: `🔒 THREAT INTELLIGENCE BRIEF\n\n${report.title}\n\n${report.executive_summary || ""}\n\n#ThreatIntel #Cybersecurity #OSINT #InfoSec`,
        report_id: reportId,
      });
    }
  };

  const getPostStatus = (post) => {
    const scheduled = new Date(post.scheduled_for);
    const now = new Date();
    if (post.status === "posted") return { label: "Posted", color: "bg-green-500/10 text-green-500" };
    if (post.status === "failed") return { label: "Failed", color: "bg-red-500/10 text-red-500" };
    if (scheduled > now) return { label: "Pending", color: "bg-yellow-500/10 text-yellow-500" };
    return { label: "Ready", color: "bg-blue-500/10 text-blue-500" };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Send className="w-5 h-5 text-[#00d4ff]" />
          <h2 className="text-lg font-bold text-white">LinkedIn Post Scheduler</h2>
          <span className="text-xs bg-[#00d4ff]/10 text-[#00d4ff] px-2 py-1 rounded-lg">{scheduledPosts.length} posts</span>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-[#00d4ff]/10 border border-[#00d4ff]/20 text-[#00d4ff] hover:bg-[#00d4ff]/20 gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Schedule Post
        </Button>
      </div>

      {showForm && (
        <Card className="bg-[#0d1220] border-[#00d4ff]/20 p-5 space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Post Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4ff]"
                placeholder="e.g., Weekly Threat Intel Roundup"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Select from Recent Report (optional)</label>
              <select
                value={form.report_id}
                onChange={(e) => handlePopulateFromReport(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4ff]"
              >
                <option value="">-- None --</option>
                {reports.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Post Content</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4ff] resize-none"
                placeholder="Write your threat intelligence post..."
                rows="6"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Scheduled Date
                </label>
                <input
                  type="date"
                  value={form.scheduled_date}
                  onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4ff]"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Time (UTC)
                </label>
                <input
                  type="time"
                  value={form.scheduled_time}
                  onChange={(e) => setForm({ ...form, scheduled_time: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4ff]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1.5 flex items-center gap-1">
                <Image className="w-3.5 h-3.5" /> Media URLs (comma-separated, optional)
              </label>
              <input
                type="text"
                value={form.media_urls}
                onChange={(e) => setForm({ ...form, media_urls: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00d4ff]"
                placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-2.5">Post Destinations</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={form.post_to_personal}
                    onChange={(e) => setForm({ ...form, post_to_personal: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-300">Post to Personal Profile</span>
                </label>
              </div>

              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Company Pages (add manually with org IDs):</p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {form.company_pages.map((page, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded-lg">
                      <span className="text-xs text-gray-300">{page.name}</span>
                      <button
                        onClick={() => toggleCompanyPage(page)}
                        className="text-xs text-red-500 hover:text-red-400"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-3 border-t border-white/5">
            <Button variant="ghost" onClick={resetForm} className="text-gray-400 text-sm">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.title || !form.content || !form.scheduled_date || createMutation.isPending}
              className="bg-[#00d4ff] text-black font-bold text-sm"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                  Scheduling...
                </>
              ) : (
                "Schedule Post"
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Scheduled Posts List */}
      <div className="space-y-2">
        {scheduledPosts.length === 0 ? (
          <div className="bg-white/5 border border-white/5 rounded-lg p-4 text-center text-sm text-gray-400">
            No scheduled posts yet. Create one to prepare your threat intel for LinkedIn.
          </div>
        ) : (
          scheduledPosts.map(post => {
            const status = getPostStatus(post);
            const scheduledTime = new Date(post.scheduled_for);

            return (
              <Card key={post.id} className="bg-[#0d1220] border-white/5 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{post.title}</h3>
                      <span className={`text-[9px] px-2 py-0.5 rounded ${status.color}`}>{status.label}</span>
                    </div>

                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">{post.content}</p>

                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[9px] bg-white/5 text-gray-400 px-2 py-1 rounded flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {scheduledTime.toLocaleDateString()} {scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>

                      {post.media_urls?.length > 0 && (
                        <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded flex items-center gap-1">
                          <Image className="w-3 h-3" />
                          {post.media_urls.length} media
                        </span>
                      )}

                      <span className="text-[9px] text-gray-500 ml-auto">
                        {(post.company_pages?.length || 0) + (post.post_to_personal ? 1 : 0)} destination(s)
                      </span>
                    </div>

                    {post.status === "posted" && post.linkedin_post_ids?.length > 0 && (
                      <div className="flex items-center gap-1 mt-2 text-[9px] text-green-500">
                        <Check className="w-3 h-3" />
                        Posted to {post.linkedin_post_ids.length} location(s)
                      </div>
                    )}

                    {post.status === "failed" && (
                      <div className="text-[9px] text-red-500 mt-2">{post.error_message || "Post failed"}</div>
                    )}
                  </div>

                  {post.status === "scheduled" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(post.id)}
                      className="h-8 w-8 text-gray-400 hover:text-red-500 ml-4"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}