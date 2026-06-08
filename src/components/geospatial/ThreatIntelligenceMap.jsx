import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, CircleMarker, FeatureGroup } from "react-leaflet";
import { EditControl } from "react-leaflet-draw";
import L from "leaflet";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Map, Download } from "lucide-react";

// Threat level colors
const THREAT_COLORS = {
  critical: '#ff0000',
  high: '#ff6600',
  medium: '#ffaa00',
  low: '#0066ff'
};

export default function ThreatIntelligenceMap() {
  const mapRef = useRef(null);
  const [drawnAreas, setDrawnAreas] = useState([]);
  const [filters, setFilters] = useState({
    threatLevels: ['critical', 'high', 'medium', 'low'],
    entityTypes: [],
    timeRange: 30
  });
  const [selectedArea, setSelectedArea] = useState(null);
  const [isGeneratingHeatmap, setIsGeneratingHeatmap] = useState(false);

  const { data: customAreas } = useQuery({
    queryKey: ['custom_geographic_areas'],
    queryFn: () => base44.entities.CustomGeographicArea.list('-created_date', 50),
    initialData: [],
  });

  const { data: threatHeatmaps } = useQuery({
    queryKey: ['threat_heatmaps', selectedArea?.id],
    queryFn: () => selectedArea ? base44.entities.ThreatHeatmap.list('-generated_date', 10) : Promise.resolve([]),
    initialData: [],
  });

  const saveAreaMutation = useMutation({
    mutationFn: (areaData) => base44.entities.CustomGeographicArea.create(areaData)
  });

  const generateHeatmapMutation = useMutation({
    mutationFn: (params) => base44.functions.invoke('aggregateThreatDataByGeography', params)
  });

  const handleDrawCreated = async (e) => {
    const { layer, layerType } = e;
    const geometry = layer.toGeoJSON().geometry;

    const newArea = {
      name: `Custom Area - ${new Date().toLocaleString()}`,
      description: `${layerType} drawn on map`,
      area_type: layerType,
      geometry: JSON.stringify(geometry),
      center_lat: layer.getBounds().getCenter().lat,
      center_lng: layer.getBounds().getCenter().lng,
      bounds: JSON.stringify({
        north: layer.getBounds().getNorth(),
        south: layer.getBounds().getSouth(),
        east: layer.getBounds().getEast(),
        west: layer.getBounds().getWest()
      }),
      color: THREAT_COLORS.high,
      monitoring_enabled: true,
      created_date: new Date().toISOString(),
      tags: ['user_drawn']
    };

    const saved = await saveAreaMutation.mutateAsync(newArea);
    setSelectedArea(saved);
    setDrawnAreas([...drawnAreas, saved]);
  };

  const handleGenerateHeatmap = async () => {
    if (!selectedArea) {
      alert("Select a geographic area first");
      return;
    }

    setIsGeneratingHeatmap(true);
    try {
      await generateHeatmapMutation.mutateAsync({
        geographicAreaId: selectedArea.id,
        threatLevels: filters.threatLevels,
        entityTypes: filters.entityTypes,
        startDate: new Date(Date.now() - filters.timeRange * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating heatmap:', error);
    } finally {
      setIsGeneratingHeatmap(false);
    }
  };

  // Get latest heatmap data
  const latestHeatmap = threatHeatmaps?.[0];

  return (
    <div className="space-y-4">
      {/* Map Container */}
      <Card className="h-[600px]">
        <MapContainer
          center={[20, 0]}
          zoom={2}
          ref={mapRef}
          style={{ height: '100%', borderRadius: '0.75rem' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* Existing Custom Areas */}
          {customAreas.map(area => {
            try {
              const geometry = JSON.parse(area.geometry);
              return (
                <GeoJSON
                  key={area.id}
                  data={{ type: 'Feature', geometry }}
                  style={() => ({
                    color: area.color || THREAT_COLORS.medium,
                    weight: 2,
                    opacity: 0.7,
                    fillOpacity: 0.2
                  })}
                  onEachFeature={() => {
                    if (mapRef.current) {
                      setTimeout(() => setSelectedArea(area), 100);
                    }
                  }}
                />
              );
            } catch (e) {
              return null;
            }
          })}

          {/* Threat Data Points */}
          {latestHeatmap?.threat_data_points?.map((point, idx) => (
            <CircleMarker
              key={idx}
              center={[point.latitude, point.longitude]}
              radius={point.intensity / 20}
              fillColor={THREAT_COLORS[point.threat_level] || '#888'}
              color={THREAT_COLORS[point.threat_level] || '#888'}
              weight={1}
              opacity={0.7}
              fillOpacity={0.6}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{point.entity_type}</p>
                  <p className="text-xs text-gray-600">Threat: {point.threat_level}</p>
                  <p className="text-xs">Intensity: {point.intensity}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Activity Clusters */}
          {latestHeatmap?.activity_clusters?.map(cluster => (
            <CircleMarker
              key={cluster.cluster_id}
              center={[cluster.center_lat, cluster.center_lng]}
              radius={Math.sqrt(cluster.activity_count) * 3}
              fillColor={THREAT_COLORS[cluster.threat_level] || '#888'}
              color={THREAT_COLORS[cluster.threat_level] || '#888'}
              weight={2}
              opacity={0.8}
              fillOpacity={0.5}
            >
              <Popup>
                <div className="text-sm font-semibold">
                  <p>Cluster: {cluster.activity_count} activities</p>
                  <p className="text-xs text-gray-600">{cluster.unique_entities} unique entities</p>
                  <p className="text-xs">Level: {cluster.threat_level}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

          {/* Drawing Controls */}
          <FeatureGroup>
            <EditControl
              position="topleft"
              onCreated={handleDrawCreated}
              onEdited={() => {}}
              draw={{
                rectangle: true,
                polygon: true,
                circle: true,
                circlemarker: false,
                marker: false,
                polyline: false
              }}
            />
          </FeatureGroup>
        </MapContainer>
      </Card>

      {/* Controls and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5" /> Geospatial Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selected Area */}
          {selectedArea && (
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="font-semibold text-sm">{selectedArea.name}</p>
              <p className="text-xs text-gray-600 mt-1">{selectedArea.description}</p>
            </div>
          )}

          {/* Threat Level Filter */}
          <div>
            <label className="text-sm font-semibold block mb-2">Threat Levels</label>
            <div className="flex flex-wrap gap-2">
              {['critical', 'high', 'medium', 'low'].map(level => (
                <label key={level} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={filters.threatLevels.includes(level)}
                    onChange={(checked) => {
                      setFilters(prev => ({
                        ...prev,
                        threatLevels: checked
                          ? [...prev.threatLevels, level]
                          : prev.threatLevels.filter(t => t !== level)
                      }));
                    }}
                  />
                  <Badge className={`capitalize ${Object.entries(THREAT_COLORS).find(([k]) => k === level) ? '' : ''}`}>
                    {level}
                  </Badge>
                </label>
              ))}
            </div>
          </div>

          {/* Time Range */}
          <div>
            <label className="text-sm font-semibold block mb-2">Time Range (Days)</label>
            <input
              type="number"
              min="1"
              max="365"
              value={filters.timeRange}
              onChange={(e) => setFilters(prev => ({ ...prev, timeRange: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          {/* Generate Heatmap Button */}
          <Button
            onClick={handleGenerateHeatmap}
            disabled={!selectedArea || isGeneratingHeatmap}
            className="w-full"
          >
            {isGeneratingHeatmap ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" /> Generate Heatmap
              </>
            )}
          </Button>

          {/* Heatmap Stats */}
          {latestHeatmap && (
            <div className="p-3 bg-green-50 border border-green-200 rounded space-y-2 text-sm">
              <p className="font-semibold">Heatmap Generated</p>
              <p>Data Points: {latestHeatmap.threat_data_points?.length || 0}</p>
              <p>Activity Clusters: {latestHeatmap.activity_clusters?.length || 0}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}