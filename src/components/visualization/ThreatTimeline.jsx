import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { AlertCircle, Target, Zap } from 'lucide-react';

export default function ThreatTimeline({ events = [] }) {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => b.timestamp - a.timestamp).slice(0, 30);
  }, [events]);

  const typeIcons = {
    alert: AlertCircle,
    campaign: Target,
    indicator: Zap,
  };

  const severityColors = {
    critical: 'bg-red-500/20 border-red-500/30',
    high: 'bg-orange-500/20 border-orange-500/30',
    medium: 'bg-yellow-500/20 border-yellow-500/30',
    low: 'bg-blue-500/20 border-blue-500/30',
    info: 'bg-blue-500/20 border-blue-500/30',
  };

  const severityDotColors = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
    info: 'bg-blue-500',
  };

  return (
    <div className="w-full space-y-1">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white">Threat Event Timeline</h3>
        <p className="text-sm text-gray-500">Last 30 events ordered by recency</p>
      </div>

      {sortedEvents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No threat events recorded yet</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[11px] top-0 bottom-0 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent"></div>

          {/* Timeline events */}
          <div className="space-y-4">
            {sortedEvents.map((event, idx) => {
              const Icon = typeIcons[event.type] || AlertCircle;
              const severityClass = severityColors[event.severity] || severityColors.info;
              const dotClass = severityDotColors[event.severity] || severityDotColors.info;

              return (
                <div key={event.id || idx} className="flex gap-4 items-start">
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div className={`w-6 h-6 rounded-full border-2 border-[#0d1220] ${dotClass} flex items-center justify-center z-10 flex-shrink-0 mt-0.5`}>
                      <div className="w-2 h-2 rounded-full bg-[#0d1220]"></div>
                    </div>
                  </div>

                  {/* Event card */}
                  <div className={`flex-1 p-4 rounded-lg border ${severityClass} hover:border-white/20 transition-colors`}>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-semibold text-white text-sm">{event.title}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(event.timestamp, 'MMM dd, yyyy • HH:mm:ss')}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        event.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                        event.severity === 'high' ? 'bg-orange-500/20 text-orange-300' :
                        event.severity === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-blue-500/20 text-blue-300'
                      }`}>
                        {event.severity?.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 capitalize">
                      {event.type === 'alert' && 'Security Alert'}
                      {event.type === 'campaign' && 'Campaign Activity'}
                      {event.type === 'indicator' && 'New Indicator'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}