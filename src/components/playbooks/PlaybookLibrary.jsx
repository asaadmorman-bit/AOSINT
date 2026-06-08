import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Clock, CheckCircle2 } from "lucide-react";

export default function PlaybookLibrary({ playbooks, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {playbooks.map((playbook) => (
        <div
          key={playbook.id}
          className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 hover:border-cyan-500/30 transition"
        >
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-white">{playbook.playbook_name}</h3>
            <p className="text-xs text-gray-400 mt-1">{playbook.description}</p>
          </div>

          <div className="space-y-2 mb-4">
            <Badge className="bg-cyan-900/30 text-cyan-300 border-cyan-500/20 text-[8px]">
              {playbook.playbook_type}
            </Badge>
            {playbook.success_rate && (
              <Badge className="ml-2 bg-green-900/30 text-green-300 border-green-500/20 text-[8px]">
                {playbook.success_rate}% success
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
            <div className="bg-slate-800/50 p-2 rounded">
              <p className="text-gray-400 flex items-center gap-1">
                <Play className="w-3 h-3" />
                Executions
              </p>
              <p className="text-white font-bold">{playbook.execution_count || 0}</p>
            </div>
            <div className="bg-slate-800/50 p-2 rounded">
              <p className="text-gray-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Avg Time
              </p>
              <p className="text-white font-bold">
                {playbook.avg_execution_time_seconds || 0}s
              </p>
            </div>
          </div>

          <Button
            onClick={() => onSelect(playbook)}
            className="w-full bg-cyan-600 hover:bg-cyan-700 flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Execute
          </Button>
        </div>
      ))}

      {playbooks.length === 0 && (
        <div className="col-span-3 text-center py-12 text-gray-500">
          <p>No active playbooks available</p>
        </div>
      )}
    </div>
  );
}