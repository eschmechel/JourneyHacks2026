import Supercluster from 'supercluster';

export interface NearbyPerson {
  userId: number;
  displayName: string | null;
  friendCode?: string;
  isFriend: boolean;
  distance: number;
  distanceCategory: string;
  latitude: number;
  longitude: number;
  bearing: number;
  lastUpdated: string | Date;
}

export interface ClusterPoint {
  type: 'Feature';
  properties: {
    cluster?: boolean;
    cluster_id?: number;
    point_count?: number;
    point_count_abbreviated?: string;
    // Original nearby person data (for non-clustered points)
    userId?: number;
    displayName?: string | null;
    friendCode?: string;
    isFriend?: boolean;
    distance?: number;
    distanceCategory?: string;
    bearing?: number;
    lastUpdated?: string | Date;
  };
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
}

/**
 * Initialize Supercluster instance with configuration
 * @param points Array of GeoJSON features
 * @param radius Cluster radius in pixels (default: 40, which corresponds to ~50m at zoom 13)
 * @param maxZoom Maximum zoom level for clustering (default: 18)
 */
export function initSupercluster(
  points: ClusterPoint[],
  radius: number = 40,
  maxZoom: number = 18
): Supercluster {
  const index = new Supercluster({
    radius,
    maxZoom,
    minPoints: 2, // Minimum 2 points to form a cluster
  });

  index.load(points);
  return index;
}

/**
 * Convert nearby people data to GeoJSON features for Supercluster
 * @param nearby Array of nearby people
 * @returns Array of GeoJSON Feature objects
 */
export function convertToGeoJSON(nearby: NearbyPerson[]): ClusterPoint[] {
  return nearby.map((person) => ({
    type: 'Feature' as const,
    properties: {
      userId: person.userId,
      displayName: person.displayName,
      friendCode: person.friendCode,
      isFriend: person.isFriend,
      distance: person.distance,
      distanceCategory: person.distanceCategory,
      bearing: person.bearing,
      lastUpdated: person.lastUpdated,
    },
    geometry: {
      type: 'Point' as const,
      coordinates: [person.longitude, person.latitude], // [lng, lat] order for GeoJSON
    },
  }));
}

/**
 * Get clusters for current map bounds and zoom level
 * @param index Supercluster instance
 * @param bounds Map bounds [westLng, southLat, eastLng, northLat]
 * @param zoom Current zoom level
 * @returns Array of cluster/point features
 */
export function getClustersForBounds(
  index: Supercluster,
  bounds: [number, number, number, number],
  zoom: number
): ClusterPoint[] {
  return index.getClusters(bounds, Math.floor(zoom)) as ClusterPoint[];
}

/**
 * Get individual points within a cluster
 * @param index Supercluster instance
 * @param clusterId Cluster ID
 * @param limit Maximum points to return (default: Infinity for all)
 * @returns Array of nearby people in the cluster
 */
export function getClusterLeaves(
  index: Supercluster,
  clusterId: number,
  limit: number = Infinity
): NearbyPerson[] {
  const leaves = index.getLeaves(clusterId, limit) as ClusterPoint[];
  
  return leaves.map((leaf) => ({
    userId: leaf.properties.userId!,
    displayName: leaf.properties.displayName!,
    isFriend: leaf.properties.isFriend!,
    distance: leaf.properties.distance!,
    distanceCategory: leaf.properties.distanceCategory!,
    latitude: leaf.geometry.coordinates[1], // lat is second in GeoJSON
    longitude: leaf.geometry.coordinates[0], // lng is first in GeoJSON
    bearing: leaf.properties.bearing!,
    lastUpdated: leaf.properties.lastUpdated!,
  }));
}
