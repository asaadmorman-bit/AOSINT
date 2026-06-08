import React, { useState } from "react";
import { Settings, X, Eye, EyeOff, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardCustomizer({ widgets, onUpdateWidgets, isCustomizing, setIsCustomizing }) {
  const [order, setOrder] = useState(widgets.map(w => w.id));
  const [visibility, setVisibility] = useState(widgets.reduce((acc, w) => ({ ...acc, [w.id]: w.visible !== false }), {}));

  const handleToggleVisibility = (id) => {
    const newVisibility = { ...visibility, [id]: !visibility[id] };
    setVisibility(newVisibility);
  };

  const handleSave = () => {
    const updated = widgets.map(w => ({
      ...w,
      visible: visibility[w.id],
      order: order.indexOf(w.id),
    }));
    onUpdateWidgets(updated);
    setIsCustomizing(false);
  };

  const handleReset = () => {
    setOrder(widgets.map(w => w.id));
    setVisibility(widgets.reduce((acc, w) => ({ ...acc, [w.id]: w.visible !== false }), {}));
  };

  if (!isCustomizing) {
    return (
      <button
        onClick={() => setIsCustomizing(true)}
        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        title="Customize dashboard"
      >
        <Settings className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-white/10 rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#111827] border-b border-white/10 p-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Customize Dashboard</h3>
          <button onClick={() => setIsCustomizing(false)} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Widget Visibility</h4>
          {widgets.map(widget => (
            <button
              key={widget.id}
              onClick={() => handleToggleVisibility(widget.id)}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-gray-600" />
                <div className="text-left">
                  <p className="text-sm font-bold text-white">{widget.name}</p>
                  <p className="text-xs text-gray-500">{widget.description}</p>
                </div>
              </div>
              {visibility[widget.id] ? (
                <Eye className="w-4 h-4 text-[#2ed573]" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-600" />
              )}
            </button>
          ))}
        </div>

        <div className="border-t border-white/10 p-6 flex gap-3">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            Reset to Default
          </Button>
          <Button onClick={handleSave} className="flex-1 bg-[#00d4ff] text-black font-bold">
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}