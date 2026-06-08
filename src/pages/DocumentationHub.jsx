import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Plus, Loader2, FileText, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DocumentationHub() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    doc_type: "instruction_manual",
    subject_area: "",
    prompt_text: "",
    include_examples: true,
    include_best_practices: true,
  });

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const data = await base44.entities.GeneratedDocumentation.list('-created_at', 20);
        setDocs(data);
      } catch (error) {
        toast.error("Failed to load documentation");
      } finally {
        setLoading(false);
      }
    };

    loadDocs();
  }, []);

  const handleGenerate = async () => {
    if (!formData.subject_area || !formData.prompt_text) {
      toast.error("Subject area and prompt required");
      return;
    }

    setGenerating(true);
    try {
      const response = await base44.functions.invoke("generateDocumentationWithClaude", {
        doc_type: formData.doc_type,
        subject_area: formData.subject_area,
        prompt_text: formData.prompt_text,
        include_examples: formData.include_examples,
        include_best_practices: formData.include_best_practices,
      });

      if (response.data.success) {
        toast.success("Documentation generated successfully");
        setFormData({
          doc_type: "instruction_manual",
          subject_area: "",
          prompt_text: "",
          include_examples: true,
          include_best_practices: true,
        });
        setShowGenerator(false);

        // Reload docs
        const updated = await base44.entities.GeneratedDocumentation.list('-created_at', 20);
        setDocs(updated);
      }
    } catch (error) {
      toast.error("Failed to generate documentation");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-[#00d4ff]" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#00d4ff]" />
          <h1 className="text-2xl font-bold">Documentation Hub</h1>
        </div>
        <Button onClick={() => setShowGenerator(!showGenerator)}>
          <Plus className="w-4 h-4 mr-2" /> Generate Documentation
        </Button>
      </div>

      {showGenerator && (
        <div className="border border-white/10 rounded-lg p-6 space-y-4 bg-white/5">
          <div>
            <label className="text-sm font-medium block mb-2">Documentation Type</label>
            <select
              value={formData.doc_type}
              onChange={(e) => setFormData({ ...formData, doc_type: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
            >
              <option value="instruction_manual">Instruction Manual</option>
              <option value="use_case">Use Case</option>
              <option value="best_practice">Best Practice Guide</option>
              <option value="compliance_guide">Compliance Guide</option>
              <option value="workflow_guide">Workflow Guide</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Subject Area</label>
            <input
              placeholder="e.g., OSINT threat hunting, vulnerability management"
              value={formData.subject_area}
              onChange={(e) => setFormData({ ...formData, subject_area: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-2">Detailed Request</label>
            <textarea
              placeholder="Describe what documentation you need. Be specific about the audience and level of detail."
              value={formData.prompt_text}
              onChange={(e) => setFormData({ ...formData, prompt_text: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm h-24"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.include_examples}
                onChange={(e) => setFormData({ ...formData, include_examples: e.target.checked })}
              />
              Include practical examples
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.include_best_practices}
                onChange={(e) => setFormData({ ...formData, include_best_practices: e.target.checked })}
              />
              Include best practices
            </label>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowGenerator(false)} disabled={generating}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {generating ? "Generating..." : "Generate with Claude AI"}
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {docs.length === 0 ? (
          <div className="border border-white/10 rounded-lg p-8 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No documentation yet. Generate your first document to get started.</p>
          </div>
        ) : (
          docs.map((doc) => (
            <div key={doc.id} className="border border-white/10 rounded-lg p-4 hover:bg-white/5 transition-colors">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-[#00d4ff] flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{doc.doc_title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{doc.subject_area}</p>
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">{doc.generated_content.substring(0, 150)}...</p>
                  <div className="flex gap-2 mt-3">
                    <span className="text-[10px] bg-[#00d4ff]/10 text-[#00d4ff] px-2 py-1 rounded">
                      {doc.doc_type.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}