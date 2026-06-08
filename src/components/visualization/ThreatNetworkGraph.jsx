import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { AlertCircle, Shield, FileText, Loader2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function ThreatNetworkGraph({ assetFilter = null }) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    fetchGraphData();
  }, [assetFilter]);

  const fetchGraphData = async () => {
    try {
      setLoading(true);
      const assets = await base44.entities.Asset.list('-created_date', 50);
      const vulns = await base44.entities.VulnerabilityFinding.list('-created_date', 100);
      const reports = await base44.entities.IntelligenceReport.list('-created_date', 50);

      const graphNodes = [];
      const graphEdges = [];
      const nodeMap = new Map();

      // Add asset nodes
      assets.forEach((asset, idx) => {
        if (assetFilter && asset.name !== assetFilter) return;
        const id = `asset-${asset.id}`;
        nodeMap.set(id, true);
        graphNodes.push({
          id,
          label: asset.name || `Asset ${idx}`,
          type: 'asset',
          severity: 'info',
          data: asset,
          x: Math.random() * 800,
          y: Math.random() * 600
        });
      });

      // Add vulnerability nodes and edges
      vulns.forEach((vuln) => {
        const assetId = `asset-${vuln.affected_asset?.split('-')[1] || 'unknown'}`;
        if (!nodeMap.has(assetId)) return;

        const vnId = `vuln-${vuln.id}`;
        if (!nodeMap.has(vnId)) {
          nodeMap.set(vnId, true);
          graphNodes.push({
            id: vnId,
            label: vuln.title || vuln.cve_id || 'Unknown Vuln',
            type: 'vulnerability',
            severity: vuln.severity || 'medium',
            data: vuln,
            x: Math.random() * 800,
            y: Math.random() * 600
          });
          graphEdges.push({
            source: assetId,
            target: vnId,
            type: 'vulnerability'
          });
        }
      });

      // Add intel report nodes and edges
      reports.forEach((report) => {
        const reportId = `report-${report.id}`;
        if (!nodeMap.has(reportId)) {
          nodeMap.set(reportId, true);
          graphNodes.push({
            id: reportId,
            label: report.title || 'Intel Report',
            type: 'report',
            severity: report.severity || 'medium',
            data: report,
            x: Math.random() * 800,
            y: Math.random() * 600
          });
        }

        // Connect to assets if mentioned
        graphNodes.forEach((node) => {
          if (node.type === 'asset' && report.subject_entities?.includes(node.data.name)) {
            graphEdges.push({
              source: node.id,
              target: reportId,
              type: 'report'
            });
          }
        });
      });

      setNodes(graphNodes);
      setEdges(graphEdges);
    } catch (error) {
      console.error('Failed to fetch graph data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simple force simulation
  useEffect(() => {
    if (nodes.length === 0 || loading) return;

    const simulation = () => {
      const updatedNodes = nodes.map(n => ({ ...n }));
      const k = 200; // Spring constant
      const c = 0.5; // Damping

      for (let i = 0; i < 20; i++) {
        updatedNodes.forEach((node, idx) => {
          let fx = 0, fy = 0;

          // Repulsion from other nodes
          updatedNodes.forEach((other, jdx) => {
            if (idx !== jdx) {
              const dx = node.x - other.x || 1;
              const dy = node.y - other.y || 1;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
              const force = k / (distance * distance);
              fx += (dx / distance) * force;
              fy += (dy / distance) * force;
            }
          });

          // Attraction to connected nodes
          edges.forEach((edge) => {
            let other = null;
            if (edge.source === node.id) {
              other = updatedNodes.find(n => n.id === edge.target);
            } else if (edge.target === node.id) {
              other = updatedNodes.find(n => n.id === edge.source);
            }

            if (other) {
              const dx = other.x - node.x;
              const dy = other.y - node.y;
              const distance = Math.sqrt(dx * dx + dy * dy) || 1;
              const force = (distance * distance) / k;
              fx += (dx / distance) * force;
              fy += (dy / distance) * force;
            }
          });

          node.vx = (node.vx || 0) * c + fx * 0.1;
          node.vy = (node.vy || 0) * c + fy * 0.1;
          node.x += node.vx;
          node.y += node.vy;

          // Boundary constraints
          node.x = Math.max(20, Math.min(800, node.x));
          node.y = Math.max(20, Math.min(600, node.y));
        });
      }

      setNodes(updatedNodes);
    };

    const interval = setInterval(simulation, 50);
    return () => clearInterval(interval);
  }, [nodes, edges, loading]);

  const handleZoom = (direction) => {
    setZoom(z => direction === 'in' ? z * 1.2 : z / 1.2);
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case 'asset': return '🖥️';
      case 'vulnerability': return '⚠️';
      case 'report': return '📋';
      default: return '◉';
    }
  };

  if (loading) {
    return (
      <Card className="p-8 flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Loading threat network...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-white border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Infrastructure Threat Network</h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleZoom('in')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom('out')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); fetchGraphData(); }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative bg-gray-50 rounded-lg border border-gray-200 overflow-hidden" style={{ height: '600px' }}>
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ cursor: 'grab' }}
        >
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Edges */}
            {edges.map((edge, idx) => {
              const source = nodes.find(n => n.id === edge.source);
              const target = nodes.find(n => n.id === edge.target);
              if (!source || !target) return null;

              const isVuln = edge.type === 'vulnerability';
              const strokeColor = isVuln ? '#ef4444' : '#3b82f6';
              const strokeWidth = isVuln ? 2 : 1.5;

              return (
                <line
                  key={idx}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  opacity="0.3"
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const radius = isSelected ? 28 : 22;

              return (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={radius}
                    fill={getSeverityColor(node.severity)}
                    opacity={isSelected ? 1 : 0.8}
                    style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                    onClick={() => setSelectedNode(isSelected ? null : node)}
                  />
                  <text
                    x={node.x}
                    y={node.y + 1}
                    textAnchor="middle"
                    fontSize="16"
                    dominantBaseline="middle"
                    pointerEvents="none"
                  >
                    {getNodeIcon(node.type)}
                  </text>

                  {/* Labels for asset nodes */}
                  {node.type === 'asset' && (
                    <text
                      x={node.x}
                      y={node.y + 38}
                      textAnchor="middle"
                      fontSize="11"
                      fill="#374151"
                      className="select-none"
                    >
                      {node.label.substring(0, 15)}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg border border-gray-200 text-xs space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">🖥️</span>
            <span className="text-gray-700">Assets</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <span className="text-gray-700">Vulnerabilities</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">📋</span>
            <span className="text-gray-700">Intel Reports</span>
          </div>
        </div>
      </div>

      {/* Node Details */}
      {selectedNode && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-gray-900">{selectedNode.label}</h4>
            <span className={`px-2 py-1 rounded text-xs font-medium text-white`}
              style={{ backgroundColor: getSeverityColor(selectedNode.severity) }}>
              {selectedNode.severity?.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            {selectedNode.type === 'asset' && `Asset: ${selectedNode.data.name || 'Unknown'}`}
            {selectedNode.type === 'vulnerability' && `CVE: ${selectedNode.data.cve_id || 'N/A'}`}
            {selectedNode.type === 'report' && `Report ID: ${selectedNode.data.id}`}
          </p>
          {selectedNode.data.description && (
            <p className="text-sm text-gray-700">{selectedNode.data.description.substring(0, 200)}...</p>
          )}
        </div>
      )}
    </Card>
  );
}