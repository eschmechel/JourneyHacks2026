import { Box, Text } from '@radix-ui/themes';
import { useEffect, useState } from 'react';
import { semanticColors } from '../lib/colors';

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

  const getFriendColor = (isFriend: boolean, isNew: boolean) => {
    if (isNew) return semanticColors.accentSolid; // Amber for new alerts
    return isFriend ? semanticColors.successSolid : semanticColors.infoSolid; // Green for friends, blue for non-friends
  };

  return (
    <Box
      className="p-4 mx-auto"
      style={{
        width: '100%',
        maxWidth: '400px',
      }}
    >
      <svg
        width={radarSize}
        height={radarSize}
        viewBox={`0 0 ${radarSize} ${radarSize}`}
        style={{
          backgroundColor: semanticColors.componentBg,
          border: `2px solid ${semanticColors.accentSolid}`,
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
            stroke={semanticColors.accentBorder}
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
          stroke={semanticColors.accentSolid}
          strokeWidth="1"
          opacity="0.2"
        />
        <line
          x1={20}
          y1={centerY}
          x2={radarSize - 20}
          y2={centerY}
          stroke={semanticColors.accentSolid}
          strokeWidth="1"
          opacity="0.2"
        />

        {/* Direction labels */}
        <text
          x={centerX}
          y={15}
          textAnchor="middle"
          fontSize="10"
          fill={semanticColors.lowContrastText}
          fontWeight="bold"
        >
          N
        </text>
        <text
          x={radarSize - 10}
          y={centerY + 4}
          textAnchor="middle"
          fontSize="10"
          fill={semanticColors.lowContrastText}
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
            stroke={semanticColors.accentSolid}
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
          fill={semanticColors.accentSolid}
          stroke={semanticColors.componentBg}
          strokeWidth="2"
        />
        <circle
          cx={centerX}
          cy={centerY}
          r="8"
          fill="none"
          stroke={semanticColors.accentSolid}
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
          const color = getFriendColor(friend.isFriend, isNew);

          return (
            <g key={friend.userId}>
              {/* Friend dot */}
              <circle
                cx={friend.x}
                cy={friend.y}
                r="6"
                fill={color}
                stroke={isNew ? semanticColors.accentSolid : semanticColors.componentBg}
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
                fill={semanticColors.highContrastText}
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
                fill={semanticColors.lowContrastText}
                style={{ pointerEvents: 'none' }}
              >
                {friend.distance > userRadius ? '1000+' : friend.distance}m
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <Box className="mt-3 text-center">
        <Box style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Box style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Box
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: semanticColors.accentSolid,
                border: `2px solid ${semanticColors.componentBg}`,
              }}
            />
            <Text size="1" style={{ color: semanticColors.lowContrastText }}>
              You
            </Text>
          </Box>
          <Box style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Box
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: semanticColors.successSolid,
                border: `2px solid ${semanticColors.componentBg}`,
              }}
            />
            <Text size="1" style={{ color: semanticColors.lowContrastText }}>
              Friends
            </Text>
          </Box>
          <Box style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Box
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: semanticColors.infoSolid,
                border: `2px solid ${semanticColors.componentBg}`,
              }}
            />
            <Text size="1" style={{ color: semanticColors.lowContrastText }}>
              Non-Friends
            </Text>
          </Box>
        </Box>
        <Text size="1" mt="2" style={{ color: semanticColors.lowContrastText }}>
          Radius: {userRadius}m • Rings: {Math.round(userRadius * 0.25)}m intervals
        </Text>
      </Box>
    </Box>
  );
}
