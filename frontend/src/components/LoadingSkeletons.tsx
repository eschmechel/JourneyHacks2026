import { Box, Flex, Skeleton, Card } from '@radix-ui/themes';
import { semanticColors } from '../lib/colors';

export function FriendCardSkeleton() {
  return (
    <Card className="p-3" style={{ backgroundColor: semanticColors.componentBg, border: `2px solid ${semanticColors.accentBorder}` }}>
      <Flex justify="between" align="center">
        <Box>
          <Skeleton width="120px" height="24px" mb="2" />
          <Skeleton width="80px" height="16px" />
        </Box>
        <Box style={{ textAlign: 'right' }}>
          <Skeleton width="60px" height="32px" mb="1" />
          <Skeleton width="80px" height="16px" />
        </Box>
      </Flex>
    </Card>
  );
}

export function RadarSkeleton() {
  return (
    <Box
      className="w-[300px] h-[300px] mx-auto rounded-full flex items-center justify-center"
      style={{
        backgroundColor: semanticColors.componentBg,
        border: `2px solid ${semanticColors.accentSolid}`,
      }}
    >
      <Box style={{ textAlign: 'center' }}>
        <Skeleton width="100px" height="20px" mb="2" />
        <Skeleton width="140px" height="16px" />
      </Box>
    </Box>
  );
}

export function FriendListSkeleton() {
  return (
    <>
      <FriendCardSkeleton />
      <FriendCardSkeleton />
      <FriendCardSkeleton />
    </>
  );
}
