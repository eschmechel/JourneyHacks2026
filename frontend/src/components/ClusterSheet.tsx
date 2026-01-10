import { Dialog, Flex, Card, Text, Badge, Box, IconButton } from '@radix-ui/themes';
import { Cross2Icon, PersonIcon } from '@radix-ui/react-icons';
import type { NearbyPerson } from '../utils/clustering';

interface ClusterSheetProps {
  members: NearbyPerson[];
  isOpen: boolean;
  onClose: () => void;
}

export function ClusterSheet({ members, isOpen, onClose }: ClusterSheetProps) {
  if (members.length === 0) return null;

  const title = members.length === 1
    ? members[0].displayName || 'Nearby person'
    : `${members.length} people nearby`;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Flex justify="between" align="center" mb="3">
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Close>
            <IconButton size="1" variant="ghost" color="gray">
              <Cross2Icon />
            </IconButton>
          </Dialog.Close>
        </Flex>

        <Flex direction="column" gap="2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {members.map((member) => (
            <Card key={member.userId} size="1">
              <Flex gap="3" align="center">
                <Box>
                  <PersonIcon width="20" height="20" />
                </Box>
                <Flex direction="column" gap="1" style={{ flex: 1 }}>
                  <Flex align="center" gap="2">
                    <Text size="2" weight="bold">
                      {member.displayName || `User ${member.userId}`}
                    </Text>
                    {member.isFriend && (
                      <Badge color="green" size="1">
                        Friend
                      </Badge>
                    )}
                  </Flex>
                  <Flex gap="2">
                    <Badge color="blue" size="1">
                      {member.distance > 1000 ? '1000+' : member.distance}m
                    </Badge>
                    <Badge color="gray" size="1" variant="soft">
                      {member.distanceCategory.replace('_', ' ')}
                    </Badge>
                  </Flex>
                </Flex>
              </Flex>
            </Card>
          ))}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
