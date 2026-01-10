import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { divIcon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  initSupercluster,
  convertToGeoJSON,
  getClustersForBounds,
  getClusterLeaves,
  type NearbyPerson,
  type ClusterPoint,
} from '../utils/clustering';

interface MapViewProps {
  nearby: NearbyPerson[];
  userLocation: { latitude: number; longitude: number } | null;
  onClusterClick: (members: NearbyPerson[]) => void;
}

// Component to handle map events and update clusters
function MapController({
  nearby,
  onClustersUpdate,
}: {
  nearby: NearbyPerson[];
  onClustersUpdate: (clusters: ClusterPoint[]) => void;
}) {
  const map = useMap();
  const superclusterRef = useRef<ReturnType<typeof initSupercluster> | null>(null);

  useEffect(() => {
    // Initialize supercluster with nearby data
    const points = convertToGeoJSON(nearby);
    superclusterRef.current = initSupercluster(points, 40, 18);

    // Get initial clusters
    updateClusters();

    // Listen for map movement
    const handleMoveEnd = () => updateClusters();
    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleMoveEnd);
    };
  }, [nearby, map]);

  const updateClusters = () => {
    if (!superclusterRef.current) return;

    const bounds = map.getBounds();
    const zoom = map.getZoom();

    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];

    const clusters = getClustersForBounds(superclusterRef.current, bbox, zoom);
    onClustersUpdate(clusters);
  };

  return null;
}

export function MapView({ nearby, userLocation, onClusterClick }: MapViewProps) {
  const [clusters, setClusters] = useState<ClusterPoint[]>([]);
  const superclusterRef = useRef<ReturnType<typeof initSupercluster> | null>(null);

  // Initialize supercluster when nearby data changes
  useEffect(() => {
    const points = convertToGeoJSON(nearby);
    superclusterRef.current = initSupercluster(points, 40, 18);
  }, [nearby]);

  const handleClusterClick = (cluster: ClusterPoint) => {
    if (!cluster.properties.cluster || !superclusterRef.current) return;

    const clusterId = cluster.properties.cluster_id!;
    const members = getClusterLeaves(superclusterRef.current, clusterId);
    onClusterClick(members);
  };

  const handleMarkerClick = (person: NearbyPerson) => {
    // For individual markers, pass as single-item array
    onClusterClick([person]);
  };

  if (!userLocation) {
    return (
      <div className="map-view-placeholder">
        <p>Loading map...</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={[userLocation.latitude, userLocation.longitude]}
      zoom={13}
      scrollWheelZoom={true}
      style={{ height: '500px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController nearby={nearby} onClustersUpdate={setClusters} />

      {/* User marker (pulsing orange dot) */}
      <Marker
        position={[userLocation.latitude, userLocation.longitude]}
        icon={divIcon({
          className: 'user-marker',
          html: '<div class="user-marker-pulse"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        })}
      />

      {/* Cluster and individual markers */}
      {clusters.map((cluster, index) => {
        const [lng, lat] = cluster.geometry.coordinates;

        if (cluster.properties.cluster) {
          // Cluster marker
          const pointCount = cluster.properties.point_count || 0;
          const clusterColor = pointCount >= 3 ? '#f97316' : '#3b82f6'; // Orange for 3+, blue otherwise
          return (
            <Marker
              key={`cluster-${cluster.properties.cluster_id}-${index}`}
              position={[lat, lng]}
              icon={divIcon({
                className: 'cluster-marker',
                html: `<div class="cluster-marker-inner" style="background-color: ${clusterColor};">${pointCount}</div>`,
                iconSize: [40, 40],
                iconAnchor: [20, 20],
              })}
              eventHandlers={{
                click: () => handleClusterClick(cluster),
              }}
            />
          );
        } else {
          // Individual marker
          const person: NearbyPerson = {
            userId: cluster.properties.userId!,
            displayName: cluster.properties.displayName!,
            isFriend: cluster.properties.isFriend!,
            distance: cluster.properties.distance!,
            distanceCategory: cluster.properties.distanceCategory!,
            latitude: lat,
            longitude: lng,
            bearing: cluster.properties.bearing!,
            lastUpdated: cluster.properties.lastUpdated!,
          };

          const markerColor = person.isFriend ? '#10b981' : '#3b82f6';

          return (
            <Marker
              key={`person-${person.userId}-${index}`}
              position={[lat, lng]}
              icon={divIcon({
                className: 'person-marker',
                html: `<div class="person-marker-inner" style="background-color: ${markerColor};"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              })}
              eventHandlers={{
                click: () => handleMarkerClick(person),
              }}
            />
          );
        }
      })}
    </MapContainer>
  );
}
