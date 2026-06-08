import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Send, Loader2, Trash2, Pin, CheckCircle2, MessageCircle,
  User, Clock
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function InvestigationCommentThread({ investigationId, user }) {
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ['investigationComments', investigationId],
    queryFn: () => base44.entities.InvestigationComment.filter(
      { investigation_id: investigationId },
      '-created_date',
      100
    ),
    initialData: []
  });

  const createMutation = useMutation({
    mutationFn: (content) => base44.entities.InvestigationComment.create({
      investigation_id: investigationId,
      author_email: user.email,
      author_name: user.full_name || user.email,
      content
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigationComments'] });
      setNewComment("");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.InvestigationComment.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigationComments'] });
    }
  });

  const pinMutation = useMutation({
    mutationFn: (id) => base44.entities.InvestigationComment.update(id, { is_pinned: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investigationComments'] });
    }
  });

  const unpinnedComments = comments.filter(c => !c.is_pinned);
  const pinnedComments = comments.filter(c => c.is_pinned);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-4 h-4 text-cyan-400" />
        <h3 className="font-semibold text-white text-sm">Team Comments ({comments.length})</h3>
      </div>

      {/* Pinned Comments */}
      {pinnedComments.length > 0 && (
        <div className="space-y-2 mb-4 border-l-2 border-yellow-500/30 pl-3">
          {pinnedComments.map(comment => (
            <div key={comment.id} className="bg-yellow-900/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-300 shrink-0">
                    {comment.author_name?.[0] || "?"}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{comment.author_name}</p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Pin className="w-2.5 h-2.5" /> Pinned
                    </p>
                  </div>
                </div>
              </div>
              <ReactMarkdown className="text-xs text-gray-300 prose prose-sm max-w-none">
                {comment.content}
              </ReactMarkdown>
            </div>
          ))}
        </div>
      )}

      {/* Comment Input */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment or finding... (Markdown supported, use @name to mention)"
          className="min-h-24 text-sm bg-white/5 border-white/10 text-white placeholder-gray-600"
        />
        <Button
          onClick={() => createMutation.mutate(newComment)}
          disabled={!newComment.trim() || createMutation.isPending}
          className="bg-cyan-600 hover:bg-cyan-700 text-xs h-8"
        >
          {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
          Post Comment
        </Button>
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="text-center py-4 text-gray-500 text-xs">Loading comments...</div>
      ) : unpinnedComments.length === 0 ? (
        <div className="text-center py-4 text-gray-500 text-xs">No comments yet. Start the discussion!</div>
      ) : (
        <div className="space-y-2">
          {unpinnedComments.map(comment => (
            <div key={comment.id} className="bg-white/5 border border-white/10 rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px] font-bold text-cyan-300 shrink-0">
                    {comment.author_name?.[0] || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{comment.author_name}</p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {new Date(comment.created_date).toLocaleString()}
                    </p>
                  </div>
                </div>
                {user.email === comment.author_email && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => pinMutation.mutate(comment.id)}
                      className="h-6 w-6 p-0"
                      disabled={pinMutation.isPending}
                    >
                      <Pin className="w-2.5 h-2.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(comment.id)}
                      className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </Button>
                  </div>
                )}
              </div>
              <ReactMarkdown className="text-xs text-gray-300 prose prose-sm max-w-none">
                {comment.content}
              </ReactMarkdown>
              {comment.resolved && (
                <div className="mt-2 flex items-center gap-1 text-[10px] text-green-400">
                  <CheckCircle2 className="w-3 h-3" /> Resolved by {comment.resolved_by}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}