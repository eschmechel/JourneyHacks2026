/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of first point (degrees)
 * @param lon1 Longitude of first point (degrees)
 * @param lat2 Latitude of second point (degrees)
 * @param lon2 Longitude of second point (degrees)
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Get distance category for display
 */
export function getDistanceCategory(distance: number): string {
  if (distance < 500) return 'VERY_CLOSE';
  if (distance < 1000) return 'CLOSE';
  if (distance < 2000) return 'NEARBY';
  return 'FAR';
}
