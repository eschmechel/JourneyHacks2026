import { useEffect, useRef, useState } from 'react';
import { semanticColors } from '../lib/colors';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L, { divIcon } from 'leaflet';
import {
  initSupercluster,
  convertToGeoJSON,
  getClustersForBounds,
  getClusterLeaves,
  type NearbyPerson,
  type ClusterPoint,
} from '../utils/clustering';

// Fix Leaflet default marker icon issue with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '',
  iconUrl: '',
  shadowUrl: '',
});

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
  const mapInstanceRef = useRef<number>(0);

  // Initialize supercluster when nearby data changes
  useEffect(() => {
    if (!nearby || nearby.length === 0) {
      setClusters([]);
      return;
    }
    const points = convertToGeoJSON(nearby);
    superclusterRef.current = initSupercluster(points, 40, 18);
  }, [nearby]);

  // Increment map instance counter on mount to ensure unique key
  useEffect(() => {
    mapInstanceRef.current += 1;
  }, []);

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
      <div className="h-[500px] w-full rounded-lg flex items-center justify-center" style={{ 
        backgroundColor: semanticColors.subtleBg,
        border: `2px solid ${semanticColors.accentSolid}`
      }}>
        <p style={{ color: semanticColors.lowContrastText }}>Loading map...</p>
      </div>
    );
  }

  try {
    return (
      <MapContainer
        key={`map-${mapInstanceRef.current}`}
        center={[userLocation.latitude, userLocation.longitude]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ height: '500px', width: '100%', borderRadius: '8px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
          subdomains="abcd"
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
          const clusterColor = pointCount >= 3 ? semanticColors.warningSolid : semanticColors.infoSolid; // Orange for 3+, blue otherwise
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
            friendCode: cluster.properties.friendCode,
            isFriend: cluster.properties.isFriend!,
            distance: cluster.properties.distance!,
            distanceCategory: cluster.properties.distanceCategory!,
            latitude: lat,
            longitude: lng,
            bearing: cluster.properties.bearing!,
            lastUpdated: cluster.properties.lastUpdated!,
          };

          const markerColor = person.isFriend ? semanticColors.successSolid : semanticColors.infoSolid;
          const displayName = person.displayName || `User ${person.userId}`;

          return (
            <Marker
              key={`person-${person.userId}-${index}`}
              position={[lat, lng]}
              icon={divIcon({
                className: 'person-marker-with-label',
                html: `
                  <div class="person-marker-label">${displayName}</div>
                  <div class="person-marker-inner" style="background-color: ${markerColor};"></div>
                `,
                iconSize: [16, 16],
                iconAnchor: [8, 24],
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
  } catch (error) {
    console.error('Map rendering error:', error);
    return (
      <div className="h-[500px] w-full rounded-lg flex flex-col items-center justify-center gap-2.5" style={{ 
        backgroundColor: semanticColors.dangerBg,
        border: `2px solid ${semanticColors.dangerSolid}`
      }}>
        <p style={{ color: semanticColors.dangerText, fontWeight: 'bold' }}>Map Error</p>
        <p style={{ color: semanticColors.lowContrastText }}>Failed to load map. Check console for details.</p>
      </div>
    );
  }
}
