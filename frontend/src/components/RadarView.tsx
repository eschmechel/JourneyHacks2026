import { Box, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';

interface NearbyFriend {
  userId: number;
  displayName: string | null;
  friendCode?: string;
  isFriend: boolean;
  distance: number;
  distanceCategory: string;
  latitude: number;
  longitude: number;
  bearing: number;
}

interface RadarViewProps {
  nearby: NearbyFriend[];
  newAlerts: number[];
  userRadius: number;
  userLocation?: { latitude: number; longitude: number };
}

/**
 * Calculate bearing (angle) between two coordinates
 * Returns angle in degrees (0-360, where 0 is North)
 */
function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

export function RadarView({ nearby, newAlerts, userRadius, userLocation }: RadarViewProps) {
  const [pulseActive, setPulseActive] = useState(false);

  useEffect(() => {
    // Trigger pulse animation on new alerts
    if (newAlerts.length > 0) {
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 2000);
    }
  }, [newAlerts]);

  const radarSize = 300;
  const centerX = radarSize / 2;
  const centerY = radarSize / 2;
  const maxRadius = radarSize / 2 - 20;

  // Calculate positions for friends
  const friendPositions = nearby.map((friend) => {
    if (!userLocation) return null;

    const bearing = calculateBearing(
      userLocation.latitude,
      userLocation.longitude,
      friend.latitude,
      friend.longitude
    );

    // Convert bearing to radians and adjust for SVG coordinate system
    // (0 degrees = top, clockwise)
    const angleRad = ((bearing - 90) * Math.PI) / 180;

    // Scale distance to fit within radar (using log scale for better visualization)
    const normalizedDistance = Math.min(friend.distance / userRadius, 1);
    const scaledDistance = maxRadius * normalizedDistance;

    const x = centerX + scaledDistance * Math.cos(angleRad);
    const y = centerY + scaledDistance * Math.sin(angleRad);

    return { ...friend, x, y, bearing, normalizedDistance };
  });

  const getDistanceColor = (category: string, isNew: boolean) => {
    if (isNew) return '#FFB000'; // Amber for new alerts
    switch (category) {
      case 'VERY_CLOSE':
        return '#FFD700';
      case 'CLOSE':
        return '#FFE55C';
      case 'NEARBY':
        return '#FFF4B8';
      default:
        return '#FFF9E0';
    }
  };

  return (
    <Box
      style={{
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
        padding: '1rem',
      }}
    >
      <svg
        width={radarSize}
        height={radarSize}
        viewBox={`0 0 ${radarSize} ${radarSize}`}
        style={{
          backgroundColor: '#FFF',
          border: '2px solid #FFD700',
          borderRadius: '50%',
          display: 'block',
          margin: '0 auto',
        }}
      >
        {/* Distance rings */}
        {[0.25, 0.5, 0.75, 1].map((scale) => (
          <circle
            key={scale}
            cx={centerX}
            cy={centerY}
            r={maxRadius * scale}
            fill="none"
            stroke="#FFE55C"
            strokeWidth="1"
            opacity="0.3"
          />
        ))}

        {/* Cardinal directions */}
        <line
          x1={centerX}
          y1={20}
          x2={centerX}
          y2={radarSize - 20}
          stroke="#FFD700"
          strokeWidth="1"
          opacity="0.2"
        />
        <line
          x1={20}
          y1={centerY}
          x2={radarSize - 20}
          y2={centerY}
          stroke="#FFD700"
          strokeWidth="1"
          opacity="0.2"
        />

        {/* Direction labels */}
        <text
          x={centerX}
          y={15}
          textAnchor="middle"
          fontSize="10"
          fill="#999"
          fontWeight="bold"
        >
          N
        </text>
        <text
          x={radarSize - 10}
          y={centerY + 4}
          textAnchor="middle"
          fontSize="10"
          fill="#999"
          fontWeight="bold"
        >
          E
        </text>

        {/* Pulse animation for new alerts */}
        {pulseActive && (
          <circle
            cx={centerX}
            cy={centerY}
            r={maxRadius}
            fill="none"
            stroke="#FFB000"
            strokeWidth="2"
            opacity="0"
          >
            <animate
              attributeName="r"
              from={centerX - 10}
              to={maxRadius}
              dur="2s"
              repeatCount="1"
            />
            <animate
              attributeName="opacity"
              from="0.6"
              to="0"
              dur="2s"
              repeatCount="1"
            />
          </circle>
        )}

        {/* User position (center) */}
        <circle
          cx={centerX}
          cy={centerY}
          r="8"
          fill="#FFB000"
          stroke="#FFF"
          strokeWidth="2"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r="8"
          fill="none"
          stroke="#FFB000"
          strokeWidth="2"
          opacity="0.3"
        >
          <animate
            attributeName="r"
            from="8"
            to="20"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            from="0.3"
            to="0"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Friends */}
        {friendPositions.map((friend) => {
          if (!friend) return null;
          const isNew = newAlerts.includes(friend.userId);
          const color = getDistanceColor(friend.distanceCategory, isNew);

          return (
            <g key={friend.userId}>
              {/* Friend dot */}
              <circle
                cx={friend.x}
                cy={friend.y}
                r="6"
                fill={color}
                stroke={isNew ? '#FFB000' : '#FFF'}
                strokeWidth={isNew ? '3' : '2'}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.5s ease',
                }}
              >
                {isNew && (
                  <animate
                    attributeName="r"
                    from="6"
                    to="12"
                    dur="1s"
                    repeatCount="2"
                  />
                )}
              </circle>

              {/* Friend label */}
              <text
                x={friend.x}
                y={friend.y - 12}
                textAnchor="middle"
                fontSize="9"
                fill="#000"
                fontWeight="bold"
                style={{ pointerEvents: 'none' }}
              >
                {(friend.displayName || friend.friendCode || `User ${friend.userId}`).slice(0, 8)}
              </text>
              <text
                x={friend.x}
                y={friend.y + 18}
                textAnchor="middle"
                fontSize="8"
                fill="#666"
                style={{ pointerEvents: 'none' }}
              >
                {friend.distance > userRadius ? '1000+' : friend.distance}m
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <Box mt="3" style={{ textAlign: 'center' }}>
        <Box style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Box
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#FFB000',
                border: '2px solid #FFF',
              }}
            />
            <Text size="1" style={{ color: '#666' }}>
              You
            </Text>
          </Box>
          <Box style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Box
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#FFD700',
                border: '2px solid #FFF',
              }}
            />
            <Text size="1" style={{ color: '#666' }}>
              Very Close
            </Text>
          </Box>
          <Box style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Box
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: '#FFE55C',
                border: '2px solid #FFF',
              }}
            />
            <Text size="1" style={{ color: '#666' }}>
              Close
            </Text>
          </Box>
        </Box>
        <Text size="1" mt="2" style={{ color: '#999' }}>
          Radius: {userRadius}m • Rings: {Math.round(userRadius * 0.25)}m intervals
        </Text>
      </Box>
    </Box>
  );
}
