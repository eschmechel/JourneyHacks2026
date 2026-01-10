import { Box, Flex, Skeleton, Card } from '@radix-ui/themes';

export function FriendCardSkeleton() {
  return (
    <Card style={{ backgroundColor: '#FFF', border: '2px solid #FFE55C' }}>
      <Flex justify="between" align="center" p="3">
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
      style={{
        width: '300px',
        height: '300px',
        margin: '0 auto',
        backgroundColor: '#FFF',
        border: '2px solid #FFD700',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
